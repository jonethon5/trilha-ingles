// Compara duas gravações da mesma frase (o modelo e a voz do aluno) e devolve uma nota de 0 a 100.
//
// Como funciona, em quatro passos:
//   1. As duas gravações são levadas para a mesma taxa (16 kHz) e o silêncio das pontas é cortado.
//   2. Cada uma é fatiada em janelas de 25 ms e cada janela vira 12 números (MFCC), que descrevem
//      o "formato" do som naquele instante: é a mesma representação usada em reconhecimento de fala.
//      A eles se somam outros 12 que dizem como o som está mudando (deltas).
//   3. A média de cada número é subtraída por gravação, o que reduz a diferença entre vozes e microfones.
//      (Normalizar também a variância piorou muito a separação nos testes, então não é feito.)
//   4. As duas sequências são alinhadas no tempo (DTW), porque ninguém fala na mesma velocidade,
//      e a distância média ao longo do alinhamento vira a nota.
//
// É uma medida de semelhança com o modelo (ritmo e sons), não um avaliador de pronúncia treinado.

export const RATE = 16000;
const FRAME = 400; // 25 ms
const HOP = 160; // 10 ms
const FFT_SIZE = 512;
const MEL_BANDS = 26;
const COEFFS = 12;
const DIMS = COEFFS * 2; // coeficientes + deltas

// Distâncias de referência, medidas no navegador com 16 frases: o modelo em MP3 contra outra voz
// sintética, direto do arquivo e passando pelo microfone. A mesma frase dita por outra voz ficou
// entre 0,30 e 0,53 (mediana 0,45); frases diferentes, entre 0,50 e 0,87 (mediana 0,66).
// São vozes sintéticas: gravações de pessoas, com sotaque e ruído, tendem a ficar mais distantes.
export const CALIBRATION = { same: 0.45, different: 0.66 };

export function resample(samples, from, to = RATE) {
  if (from === to) return Float32Array.from(samples);
  const ratio = from / to;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  if (ratio > 1) {
    // Reduzindo a taxa: média de cada bloco, para não criar chiado (aliasing).
    for (let i = 0; i < out.length; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let j = start; j < end; j++) sum += samples[j];
      out[i] = sum / Math.max(1, end - start);
    }
  } else {
    for (let i = 0; i < out.length; i++) {
      const pos = i * ratio;
      const a = Math.floor(pos);
      const b = Math.min(samples.length - 1, a + 1);
      out[i] = samples[a] + (samples[b] - samples[a]) * (pos - a);
    }
  }
  return out;
}

function frameEnergies(x) {
  const count = Math.max(0, Math.floor((x.length - FRAME) / HOP) + 1);
  const out = new Float32Array(count);
  for (let f = 0; f < count; f++) {
    let sum = 0;
    for (let i = 0; i < FRAME; i++) sum += x[f * HOP + i] ** 2;
    out[f] = Math.sqrt(sum / FRAME);
  }
  return out;
}

// Corta o silêncio do começo e do fim, deixando uma pequena margem.
export function trimSilence(x) {
  const energy = frameEnergies(x);
  let peak = 0;
  for (const e of energy) peak = Math.max(peak, e);
  if (peak < 0.003) return new Float32Array(0); // não há voz na gravação
  const threshold = Math.max(0.006, peak * 0.08);
  let first = 0;
  let last = energy.length - 1;
  while (first < energy.length && energy[first] < threshold) first++;
  while (last > first && energy[last] < threshold) last--;
  const start = Math.max(0, (first - 5) * HOP);
  const end = Math.min(x.length, (last + 6) * HOP + FRAME);
  return x.subarray(start, end);
}

// Volume ao longo do tempo, em `points` pontos de 0 a 1, para desenhar as duas falas uma sobre a outra.
export function envelope(x, points = 96) {
  const out = new Array(points).fill(0);
  if (!x.length) return out;
  const size = x.length / points;
  let peak = 0;
  for (let p = 0; p < points; p++) {
    const start = Math.floor(p * size);
    const end = Math.max(start + 1, Math.floor((p + 1) * size));
    let sum = 0;
    for (let i = start; i < end && i < x.length; i++) sum += x[i] ** 2;
    out[p] = Math.sqrt(sum / (end - start));
    peak = Math.max(peak, out[p]);
  }
  return out.map((v) => (peak ? v / peak : 0));
}

// FFT radix-2 in-place.
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tRe = re[b] * curRe - im[b] * curIm;
        const tIm = re[b] * curIm + im[b] * curRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel) => 700 * (10 ** (mel / 2595) - 1);

let filterbank = null;
let window = null;
let dct = null;

function tables() {
  if (filterbank) return;
  window = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i++) window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME - 1));

  const bins = FFT_SIZE / 2 + 1;
  const low = hzToMel(100);
  const high = hzToMel(6800);
  const centers = [];
  for (let m = 0; m < MEL_BANDS + 2; m++) {
    centers.push(Math.floor(((FFT_SIZE + 1) * melToHz(low + ((high - low) * m) / (MEL_BANDS + 1))) / RATE));
  }
  filterbank = [];
  for (let m = 1; m <= MEL_BANDS; m++) {
    const filter = new Float32Array(bins);
    for (let k = centers[m - 1]; k < centers[m]; k++) filter[k] = (k - centers[m - 1]) / Math.max(1, centers[m] - centers[m - 1]);
    for (let k = centers[m]; k < centers[m + 1]; k++) filter[k] = (centers[m + 1] - k) / Math.max(1, centers[m + 1] - centers[m]);
    filterbank.push(filter);
  }
  dct = [];
  for (let c = 1; c <= COEFFS; c++) {
    const row = new Float32Array(MEL_BANDS);
    for (let m = 0; m < MEL_BANDS; m++) row[m] = Math.cos((Math.PI * c * (m + 0.5)) / MEL_BANDS);
    dct.push(row);
  }
}

// Uma linha por janela de 25 ms: 12 coeficientes (com a média da gravação subtraída) e seus 12 deltas.
export function mfcc(x) {
  tables();
  const count = Math.max(0, Math.floor((x.length - FRAME) / HOP) + 1);
  const frames = [];
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const mel = new Float32Array(MEL_BANDS);
  for (let f = 0; f < count; f++) {
    re.fill(0);
    im.fill(0);
    const base = f * HOP;
    for (let i = 0; i < FRAME; i++) {
      const prev = base + i > 0 ? x[base + i - 1] : 0;
      re[i] = (x[base + i] - 0.97 * prev) * window[i]; // pré-ênfase: realça os agudos, onde estão as consoantes
    }
    fft(re, im);
    for (let m = 0; m < MEL_BANDS; m++) {
      let sum = 0;
      const filter = filterbank[m];
      for (let k = 0; k < filter.length; k++) if (filter[k]) sum += filter[k] * (re[k] * re[k] + im[k] * im[k]);
      mel[m] = Math.log(sum + 1e-9);
    }
    const row = new Float32Array(COEFFS);
    for (let c = 0; c < COEFFS; c++) {
      let sum = 0;
      for (let m = 0; m < MEL_BANDS; m++) sum += dct[c][m] * mel[m];
      row[c] = sum;
    }
    frames.push(row);
  }
  for (let c = 0; c < COEFFS; c++) {
    let mean = 0;
    for (const row of frames) mean += row[c];
    mean /= frames.length || 1;
    for (const row of frames) row[c] -= mean;
  }
  return frames.map((row, i) => {
    const before = frames[Math.max(0, i - 2)];
    const after = frames[Math.min(frames.length - 1, i + 2)];
    const out = new Float32Array(DIMS);
    out.set(row);
    for (let c = 0; c < COEFFS; c++) out[COEFFS + c] = (after[c] - before[c]) / 2;
    return out;
  });
}

// Alinhamento temporal dinâmico: custo médio do melhor caminho que casa as duas sequências.
export function dtw(a, b) {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;
  const band = Math.max(Math.abs(n - m) + 10, Math.floor(Math.max(n, m) * 0.25));
  let prev = new Float64Array(m + 1).fill(Infinity);
  let cur = new Float64Array(m + 1).fill(Infinity);
  let prevLen = new Float64Array(m + 1);
  let curLen = new Float64Array(m + 1);
  prev[0] = 0;
  for (let i = 1; i <= n; i++) {
    cur.fill(Infinity);
    const center = Math.round((i * m) / n);
    const from = Math.max(1, center - band);
    const to = Math.min(m, center + band);
    for (let j = from; j <= to; j++) {
      // Distância de cosseno: compara a direção dos vetores, não o tamanho, então o volume não interfere.
      const ra = a[i - 1];
      const rb = b[j - 1];
      let dot = 0;
      let na = 0;
      let nb = 0;
      for (let c = 0; c < DIMS; c++) {
        dot += ra[c] * rb[c];
        na += ra[c] * ra[c];
        nb += rb[c] * rb[c];
      }
      const d = 1 - dot / (Math.sqrt(na * nb) || 1);
      let best = prev[j - 1];
      let len = prevLen[j - 1];
      if (prev[j] < best) {
        best = prev[j];
        len = prevLen[j];
      }
      if (cur[j - 1] < best) {
        best = cur[j - 1];
        len = curLen[j - 1];
      }
      cur[j] = best + d;
      curLen[j] = len + 1;
    }
    [prev, cur] = [cur, prev];
    [prevLen, curLen] = [curLen, prevLen];
  }
  return prev[m] / prevLen[m];
}

export function distanceToScore(distance, { same, different } = CALIBRATION) {
  // Quem fica na distância de "mesma frase, outra voz" recebe 88; na de "frase diferente", 25.
  const score = 88 - ((distance - same) / (different - same)) * 63;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param model amostras do áudio modelo e sua taxa: { samples, rate }
 * @param user amostras da gravação do aluno e sua taxa
 */
export function compare(model, user) {
  const a = trimSilence(resample(model.samples, model.rate));
  const b = trimSilence(resample(user.samples, user.rate));
  const base = { modelEnvelope: envelope(a), userEnvelope: envelope(b), modelSeconds: a.length / RATE, userSeconds: b.length / RATE };
  if (b.length < RATE * 0.25) return { ...base, score: 0, problem: "silent" };
  const ratio = b.length / a.length;
  const distance = dtw(mfcc(a), mfcc(b));
  let score = distanceToScore(distance);
  let problem = null;
  // Falar só um pedaço da frase, ou enrolar muito, não pode render nota alta.
  if (ratio < 0.5) {
    score = Math.min(score, 30);
    problem = "short";
  } else if (ratio > 2.5) {
    score = Math.min(score, 40);
    problem = "long";
  }
  return { ...base, score, distance, ratio, problem };
}

export function label(score) {
  if (score >= 75) return "Muito parecido com o modelo";
  if (score >= 60) return "Bom, está no caminho";
  if (score >= 45) return "Dá para chegar mais perto";
  return "Ouça o modelo e tente de novo";
}

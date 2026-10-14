// Quem fala cada áudio. Cada personagem tem a sua voz, e a tela mostra sempre o personagem
// dono da voz que está tocando. Usado pelo app (para escolher o personagem) e pela ferramenta
// que gera os áudios (para escolher a voz).
//
// Todas as vozes são do sintetizador Piper e têm licença que permite publicar:
//   ljspeech, kristin, norman, bryce: domínio público
//   libritts_r: CC BY 4.0 (exige crédito: LibriTTS-R, de Koizumi et al., 2023)

import { castFor } from "./characters.js";

// `speaker` escolhe uma das 904 vozes do modelo libritts_r; `speed` acima de 1 deixa a fala mais lenta.
// As vozes foram escolhidas pelo tom médio medido (as agudas para as personagens femininas) e
// a velocidade foi igualada para todas falarem no mesmo ritmo, um pouco devagar para quem aprende.
export const VOICES = {
  cora: { model: "en_US-ljspeech-medium", speed: 1.0 },
  bia: { model: "en_US-libritts_r-medium", speaker: 315, speed: 1.08 },
  malu: { model: "en_US-libritts_r-medium", speaker: 60, speed: 1.15 },
  rosa: { model: "en_US-kristin-medium", speed: 1.0 },
  leo: { model: "en_US-bryce-medium", speed: 0.78 },
  tom: { model: "en_US-norman-medium", speed: 1.03 },
};

// Quem fala uma frase, pelo id dela:
//   frases do curso ("u1-l2-s3") e vocabulário: o personagem da lição
//   histórias ("pigs-2-4"): o narrador da história
//   palavras em contexto ("w-get-1"): o personagem da palavra
//   treino de fala ("a1-03"): o personagem da frase
//   palavras soltas e exemplos de som: a Cora
export function speakerFor(id) {
  if (!id) return "cora";
  const course = /^(u\d+-l\d+)-s\d+$/.exec(id);
  if (course) return castFor(course[1]);
  const word = /^w-([a-z]+)-\d+$/.exec(id);
  if (word) return castFor(`w-${word[1]}`);
  const story = /^([a-z]+)-\d+-\d+$/.exec(id);
  if (story) return castFor(story[1]);
  if (/^[ab]\d-\d+$/.test(id)) return castFor(id);
  return "cora";
}

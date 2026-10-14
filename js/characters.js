// Personagens de corpo inteiro, desenhados em SVG por código. Proporção de desenho animado:
// cabeça grande, olhos com brilho, bochechas rosadas e roupa com sombra.
//
// As peças com classe são os ganchos das animações do CSS:
//   eye         piscar
//   arm-l/arm-r acenar e gesticular enquanto fala
//   head        balançar de leve no ritmo da fala
//   mouth       a boca parada (muda com o humor: normal, happy, sad)
//   mouth-talk  a boca aberta, que estica conforme o volume da fala (variável CSS --mouth)

export const CAST = {
  bia: { name: "Bia", skin: "#8d5a3b", hair: "#2a1a12", style: "puff", top: "#ffc800", bottom: "#2b70c9", shoes: "#ff4b4b", iris: "#4a2c17", lashes: true, extra: "earrings" },
  leo: { name: "Leo", skin: "#f2c48d", hair: "#6b3e1c", style: "spiky", top: "#58cc02", bottom: "#3c3c44", shoes: "#1cb0f6", iris: "#3d6b2f", extra: "hoodie" },
  rosa: { name: "Dona Rosa", skin: "#e8b98a", hair: "#dcdce4", style: "bun", top: "#ce82ff", bottom: "#6c6c80", shoes: "#8a5a2b", iris: "#5a4030", lashes: true, extra: "glasses" },
  tom: { name: "Tom", skin: "#b9773f", hair: "#1c1c1c", style: "short", top: "#ff4b4b", bottom: "#2b3a67", shoes: "#4b4b4b", iris: "#2b1a0a", extra: "beard" },
  malu: { name: "Malu", skin: "#ffdcb5", hair: "#e0782b", style: "long", top: "#1cb0f6", bottom: null, shoes: "#ff86d0", iris: "#2f7d4f", lashes: true, extra: "freckles" },
};

export const CAST_IDS = Object.keys(CAST);

// Escolhe sempre o mesmo personagem para o mesmo texto (uma lição, uma história...).
export function castFor(key) {
  let sum = 0;
  for (const ch of String(key)) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return CAST_IDS[sum % CAST_IDS.length];
}

// Escurece (fator negativo) ou clareia (positivo) uma cor #rrggbb.
export function shade(hex, factor) {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(factor < 0 ? c * (1 + factor) : c + (255 - c) * factor);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Cabelo: a parte de trás (atrás da cabeça) e a de frente (franja e topo).
const HAIR = {
  puff: (c) => ({
    back: `<circle cx="70" cy="22" r="20" fill="${c}"/><circle cx="56" cy="26" r="9" fill="${shade(c, 0.12)}"/>`,
    front: `<path d="M27 74 q-4 -50 43 -50 q47 0 43 50 q-10 -30 -43 -30 q-33 0 -43 30z" fill="${c}"/><path d="M48 33 q12 -6 26 -3" stroke="${shade(c, 0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }),
  spiky: (c) => ({
    back: "",
    front: `<path d="M27 72 q-3 -46 43 -46 q46 0 43 46 l-8 -20 -7 12 -6 -18 -9 13 -6 -16 -8 14 -7 -14 -7 15 -6 -12 -8 18z" fill="${c}"/><path d="M50 34 q14 -7 30 -2" stroke="${shade(c, 0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }),
  bun: (c) => ({
    back: `<circle cx="70" cy="20" r="15" fill="${c}"/><circle cx="64" cy="16" r="5" fill="${shade(c, 0.35)}"/>`,
    front: `<path d="M27 74 q-4 -50 43 -50 q47 0 43 50 q-6 -24 -22 -30 q-14 10 -42 8 q-16 6 -22 22z" fill="${c}"/><path d="M80 32 q10 3 16 12" stroke="${shade(c, 0.4)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }),
  short: (c) => ({
    back: "",
    front: `<path d="M28 70 q-2 -44 42 -44 q44 0 42 44 q-8 -24 -42 -24 q-34 0 -42 24z" fill="${c}"/><path d="M52 32 q12 -5 26 -2" stroke="${shade(c, 0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }),
  long: (c) => ({
    back: `<path d="M24 124 q-16 -96 46 -96 q62 0 46 96 l-14 -2 q4 -54 -32 -56 q-36 2 -32 56z" fill="${shade(c, -0.12)}"/>`,
    front: `<path d="M27 72 q-4 -48 43 -48 q47 0 43 48 q-6 -10 -14 -14 q-4 8 -12 8 q-4 -10 -17 -12 q-13 2 -17 12 q-8 0 -12 -8 q-8 4 -14 14z" fill="${c}"/><path d="M48 34 q12 -7 28 -4" stroke="${shade(c, 0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }),
};

const LIP = "#7a2e1f";

const MOUTHS = {
  normal: `<path class="mouth" d="M60 96 q10 9 20 0" fill="none" stroke="${LIP}" stroke-width="3.2" stroke-linecap="round"/>`,
  happy: `<g class="mouth"><path d="M57 93 q13 18 26 0z" fill="${LIP}"/><path d="M60 94 h20 l-2 3 h-16z" fill="#fff"/><ellipse cx="70" cy="101" rx="6" ry="3" fill="#ff7a8a"/></g>`,
  sad: `<path class="mouth" d="M61 100 q9 -7 18 0" fill="none" stroke="${LIP}" stroke-width="3.2" stroke-linecap="round"/>`,
};

// side é -1 para o olho esquerdo e 1 para o direito: os cílios ficam só no canto de fora.
function eye(x, c, mood, side) {
  const lid = mood === "sad" ? `<path d="M${x - 11} ${74} q11 -6 22 0 v-10 h-22z" fill="${c.skin}"/>` : "";
  const lashes = c.lashes ? `<path d="M${x + side * 8} 71 l${side * 5} -3 M${x + side * 10} 75 l${side * 5} -1" stroke="#2b1a0a" stroke-width="2.2" stroke-linecap="round"/>` : "";
  return `<g class="eye"><ellipse cx="${x}" cy="78" rx="10" ry="11" fill="#fff"/><circle cx="${x + 1}" cy="79" r="7" fill="${c.iris}"/>
    <circle cx="${x + 1}" cy="79" r="3.6" fill="#140b05"/><circle cx="${x + 3.5}" cy="75.5" r="2.4" fill="#fff"/><circle cx="${x - 2}" cy="82" r="1.1" fill="#fff"/>${lashes}${lid}</g>`;
}

function extras(c, part) {
  if (part === "body") {
    if (c.extra === "hoodie") return `<path d="M58 116 l-3 22 M82 116 l3 22" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="54" y="148" width="32" height="14" rx="6" fill="${shade(c.top, -0.15)}"/>`;
    if (c.extra === "glasses") return `<path d="M56 118 q14 12 28 0" fill="none" stroke="#fff6e6" stroke-width="3" stroke-dasharray="0.1 6" stroke-linecap="round"/><circle cx="70" cy="140" r="2.5" fill="${shade(c.top, -0.3)}"/><circle cx="70" cy="154" r="2.5" fill="${shade(c.top, -0.3)}"/>`;
    if (c.extra === "beard") return `<path d="M58 110 l12 12 12 -12" fill="#fff"/><circle cx="70" cy="136" r="2.3" fill="${shade(c.top, -0.35)}"/><circle cx="70" cy="150" r="2.3" fill="${shade(c.top, -0.35)}"/>`;
    if (c.extra === "freckles") return `<path d="M70 132 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#fff" opacity="0.9"/>`;
    return `<path d="M60 112 q10 8 20 0" fill="none" stroke="${shade(c.top, -0.25)}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (c.extra === "glasses") return `<g fill="none" stroke="#3a3a48" stroke-width="2.6"><circle cx="54" cy="78" r="13"/><circle cx="86" cy="78" r="13"/><path d="M67 77 h6"/></g>`;
  if (c.extra === "beard") return `<path d="M32 84 q6 34 38 36 q32 -2 38 -36 q-6 12 -14 14 q-10 -6 -24 -6 q-14 0 -24 6 q-8 -2 -14 -14z" fill="${c.hair}"/>`;
  if (c.extra === "freckles") return `<g fill="${shade(c.skin, -0.3)}"><circle cx="45" cy="90" r="1.3"/><circle cx="50" cy="93" r="1.3"/><circle cx="41" cy="94" r="1.3"/><circle cx="95" cy="90" r="1.3"/><circle cx="90" cy="93" r="1.3"/><circle cx="99" cy="94" r="1.3"/></g>`;
  if (c.extra === "earrings") return `<circle cx="27" cy="94" r="4" fill="#ffc800" stroke="#e5a500" stroke-width="1.5"/><circle cx="113" cy="94" r="4" fill="#ffc800" stroke="#e5a500" stroke-width="1.5"/>`;
  return "";
}

export function character(id, { mood = "normal", height = 150, cls = "" } = {}) {
  const c = CAST[id] || CAST.bia;
  const hair = HAIR[c.style](c.hair);
  const topDark = shade(c.top, -0.18);
  const skinDark = shade(c.skin, -0.15);
  const brows =
    mood === "sad"
      ? `<path d="M44 66 l14 -5 M96 66 l-14 -5" stroke="${c.hair === "#dcdce4" ? "#9a9aa6" : c.hair}" stroke-width="3.4" stroke-linecap="round"/>`
      : `<path d="M45 62 q7 -6 15 -3 M80 59 q8 -3 15 3" fill="none" stroke="${c.hair === "#dcdce4" ? "#9a9aa6" : c.hair}" stroke-width="3.4" stroke-linecap="round"/>`;
  // Malu usa vestido; os outros, calça.
  const legs = c.bottom
    ? `<rect x="53" y="166" width="15" height="42" rx="7" fill="${c.bottom}"/><rect x="72" y="166" width="15" height="42" rx="7" fill="${shade(c.bottom, -0.12)}"/>`
    : `<rect x="56" y="176" width="11" height="32" rx="5" fill="${c.skin}"/><rect x="73" y="176" width="11" height="32" rx="5" fill="${skinDark}"/>`;
  const torso = c.bottom
    ? `<path d="M44 112 q26 -10 52 0 q6 30 4 60 q-30 8 -60 0 q-2 -30 4 -60z" fill="${c.top}"/><path d="M84 110 q12 4 12 4 q6 30 4 58 q-8 3 -16 4z" fill="${topDark}" opacity="0.55"/>`
    : `<path d="M46 112 q24 -10 48 0 q4 26 18 66 q-42 12 -84 0 q14 -40 18 -66z" fill="${c.top}"/><path d="M86 110 l8 2 q4 26 18 66 q-10 3 -22 5z" fill="${topDark}" opacity="0.55"/>`;
  const arm = (side) => {
    const x = side === "l" ? 36 : 104;
    const sx = side === "l" ? 44 : 96;
    return `<g class="arm arm-${side}"><path d="M${sx} 114 q${side === "l" ? -12 : 12} 6 ${side === "l" ? -10 : 10} 46" stroke="${side === "l" ? c.top : topDark}" stroke-width="15" stroke-linecap="round" fill="none"/><circle cx="${x}" cy="164" r="8" fill="${side === "l" ? c.skin : skinDark}"/></g>`;
  };
  return `<svg class="char mood-${mood} ${cls}" height="${height}" viewBox="0 0 140 230" role="img" aria-label="${c.name}">
    <ellipse cx="70" cy="221" rx="36" ry="6" fill="#000" opacity="0.12"/>
    ${legs}
    <path d="M47 206 h22 v6 q0 4 -4 4 h-22 q-4 0 -4 -4 q0 -6 8 -6z" fill="${c.shoes}"/><path d="M71 206 h22 q8 0 8 6 q0 4 -4 4 h-22 q-4 0 -4 -4z" fill="${shade(c.shoes, -0.15)}"/>
    ${arm("l")}${arm("r")}
    ${torso}
    ${extras(c, "body")}
    <rect x="62" y="104" width="16" height="12" rx="4" fill="${skinDark}"/>
    <g class="head">
      ${hair.back}
      <circle cx="28" cy="84" r="8" fill="${skinDark}"/><circle cx="112" cy="84" r="8" fill="${skinDark}"/>
      <circle cx="70" cy="74" r="43" fill="${c.skin}"/>
      <path d="M100 48 q14 22 6 50 q-8 14 -24 20 q24 -26 18 -70z" fill="${skinDark}" opacity="0.35"/>
      ${hair.front}
      <ellipse cx="44" cy="92" rx="8" ry="5" fill="#ff7a8a" opacity="0.45"/><ellipse cx="96" cy="92" rx="8" ry="5" fill="#ff7a8a" opacity="0.45"/>
      ${eye(54, c, mood, -1)}${eye(86, c, mood, 1)}
      ${brows}
      <path d="M67 88 q3 3 6 0" fill="none" stroke="${shade(c.skin, -0.35)}" stroke-width="2.4" stroke-linecap="round"/>
      ${extras(c, "head")}
      ${MOUTHS[mood] || MOUTHS.normal}
      <g class="mouth-talk"><ellipse cx="70" cy="99" rx="9" ry="8" fill="${LIP}"/><rect x="63" y="91" width="14" height="4" rx="2" fill="#fff"/><ellipse cx="70" cy="104" rx="5.5" ry="3.2" fill="#ff7a8a"/></g>
    </g>
  </svg>`;
}

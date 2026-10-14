// Personagens de corpo inteiro, desenhados em SVG. Cada um é montado a partir de poucas escolhas
// (pele, cabelo, roupa), e todos compartilham as mesmas animações, definidas no CSS:
// piscar, respirar, mexer a boca enquanto um áudio toca, comemorar e ficar triste.

export const CAST = {
  bia: { name: "Bia", skin: "#8d5a3b", hair: "#2a1a12", style: "bun", top: "#f5a623", bottom: "#3b4a6b" },
  leo: { name: "Leo", skin: "#f0c08a", hair: "#6b3e1c", style: "short", top: "#2aa55b", bottom: "#2f3440" },
  rosa: { name: "Dona Rosa", skin: "#e2b07e", hair: "#cfcfd6", style: "bun", top: "#7a52cc", bottom: "#55566a", glasses: true },
  tom: { name: "Tom", skin: "#b9773f", hair: "#1c1c1c", style: "short", top: "#e5484d", bottom: "#31456a", beard: true },
  malu: { name: "Malu", skin: "#ffd9b0", hair: "#d9742b", style: "long", top: "#2a8fd6", bottom: "#6b3fa0" },
};

export const CAST_IDS = Object.keys(CAST);

// Escolhe sempre o mesmo personagem para o mesmo texto (uma lição, uma história...).
export function castFor(key) {
  let sum = 0;
  for (const ch of String(key)) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return CAST_IDS[sum % CAST_IDS.length];
}

const HAIR = {
  short: (c) => `<path d="M30 56 q-2 -34 30 -34 q32 0 30 34 q-6 -16 -30 -16 q-24 0 -30 16z" fill="${c}"/>`,
  bun: (c) => `<circle cx="60" cy="18" r="12" fill="${c}"/><path d="M29 58 q-3 -36 31 -36 q34 0 31 36 q-7 -18 -31 -18 q-24 0 -31 18z" fill="${c}"/>`,
  long: (c) => `<path d="M27 96 q-8 -76 33 -76 q41 0 33 76 l-10 0 q4 -44 -23 -44 q-27 0 -23 44z" fill="${c}"/>`,
};

const MOUTH = {
  normal: `<path class="mouth" d="M51 70 q9 7 18 0" fill="none" stroke="#5a2a1a" stroke-width="3" stroke-linecap="round"/>`,
  happy: `<path class="mouth" d="M49 68 q11 13 22 0z" fill="#5a2a1a"/>`,
  sad: `<path class="mouth" d="M51 74 q9 -7 18 0" fill="none" stroke="#5a2a1a" stroke-width="3" stroke-linecap="round"/>`,
};

export function character(id, { mood = "normal", height = 150, cls = "" } = {}) {
  const c = CAST[id] || CAST.bia;
  const brows =
    mood === "sad"
      ? `<path d="M41 47 l12 -4 M79 47 l-12 -4" stroke="${c.hair}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M41 44 q6 -4 12 0 M67 44 q6 -4 12 0" fill="none" stroke="${c.hair}" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg class="char mood-${mood} ${cls}" height="${height}" viewBox="0 0 120 210" role="img" aria-label="${c.name}">
    <rect x="43" y="150" width="15" height="48" rx="6" fill="${c.bottom}"/><rect x="62" y="150" width="15" height="48" rx="6" fill="${c.bottom}"/>
    <ellipse cx="48" cy="200" rx="13" ry="7" fill="#2b2f36"/><ellipse cx="72" cy="200" rx="13" ry="7" fill="#2b2f36"/>
    <g class="arm arm-l"><rect x="21" y="96" width="14" height="50" rx="7" fill="${c.top}"/><circle cx="28" cy="148" r="8" fill="${c.skin}"/></g>
    <g class="arm arm-r"><rect x="85" y="96" width="14" height="50" rx="7" fill="${c.top}"/><circle cx="92" cy="148" r="8" fill="${c.skin}"/></g>
    <rect x="32" y="90" width="56" height="70" rx="18" fill="${c.top}"/>
    <rect x="53" y="80" width="14" height="16" fill="${c.skin}"/>
    <g class="head">
      ${c.style === "long" ? HAIR.long(c.hair) : ""}
      <circle cx="60" cy="56" r="31" fill="${c.skin}"/>
      ${c.style === "long" ? `<path d="M30 54 q-2 -32 30 -32 q32 0 30 32 q-8 -18 -30 -18 q-22 0 -30 18z" fill="${c.hair}"/>` : HAIR[c.style](c.hair)}
      ${c.beard ? `<path d="M33 66 q27 44 54 0 q-4 22 -27 24 q-23 -2 -27 -24z" fill="${c.hair}"/>` : ""}
      ${brows}
      <ellipse class="eye" cx="47" cy="54" rx="4" ry="5" fill="#22140c"/><ellipse class="eye" cx="73" cy="54" rx="4" ry="5" fill="#22140c"/>
      ${c.glasses ? `<circle cx="47" cy="54" r="10" fill="none" stroke="#3a3a44" stroke-width="2.5"/><circle cx="73" cy="54" r="10" fill="none" stroke="#3a3a44" stroke-width="2.5"/><path d="M57 54 h6" stroke="#3a3a44" stroke-width="2.5"/>` : ""}
      ${MOUTH[mood] || MOUTH.normal}
      <ellipse class="mouth-talk" cx="60" cy="72" rx="7" ry="5" fill="#5a2a1a"/>
    </g>
  </svg>`;
}

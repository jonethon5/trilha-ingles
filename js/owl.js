// A mascote do app: uma coruja marrom desenhada em SVG, com três expressões.
// As classes (eye, wing, beak) são os ganchos das animações do CSS: piscar, bater asa e falar.

const BROWN = "#8a5a2b";
const DARK = "#5e3b18";
const BELLY = "#e9cfa3";
const BEAK = "#f5a623";

const EYES = {
  // Olhos abertos, olhando para a frente.
  normal: `<circle cx="38" cy="46" r="15" fill="#fff"/><circle cx="82" cy="46" r="15" fill="#fff"/>
    <g class="eye"><circle cx="40" cy="48" r="7" fill="#2b1a0a"/><circle cx="43" cy="45" r="2.4" fill="#fff"/></g>
    <g class="eye"><circle cx="80" cy="48" r="7" fill="#2b1a0a"/><circle cx="83" cy="45" r="2.4" fill="#fff"/></g>`,
  // Olhos fechados em arco: contente.
  happy: `<circle cx="38" cy="46" r="15" fill="#fff"/><circle cx="82" cy="46" r="15" fill="#fff"/>
    <path d="M29 48 q9 -11 18 0" fill="none" stroke="#2b1a0a" stroke-width="4" stroke-linecap="round"/>
    <path d="M73 48 q9 -11 18 0" fill="none" stroke="#2b1a0a" stroke-width="4" stroke-linecap="round"/>`,
  // Pálpebras caídas e olhar para baixo: triste.
  sad: `<circle cx="38" cy="46" r="15" fill="#fff"/><circle cx="82" cy="46" r="15" fill="#fff"/>
    <circle cx="40" cy="52" r="6" fill="#2b1a0a"/><circle cx="80" cy="52" r="6" fill="#2b1a0a"/>
    <path d="M22 40 l32 8 v-20 h-32z" fill="${BROWN}"/><path d="M98 40 l-32 8 v-20 h32z" fill="${BROWN}"/>`,
};

export function owl(mood = "normal", size = 120) {
  return `<svg class="owl mood-${mood}" width="${size}" height="${size}" viewBox="0 0 120 130" role="img" aria-label="Coruja, a mascote do app">
    <path d="M22 26 l-6 -22 22 12z" fill="${DARK}"/><path d="M98 26 l6 -22 -22 12z" fill="${DARK}"/>
    <ellipse cx="60" cy="70" rx="48" ry="54" fill="${BROWN}"/>
    <ellipse cx="60" cy="88" rx="30" ry="32" fill="${BELLY}"/>
    <path d="M46 78 q4 5 8 0 M66 78 q4 5 8 0 M56 92 q4 5 8 0 M44 100 q4 5 8 0 M68 100 q4 5 8 0" fill="none" stroke="${BROWN}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse class="wing wing-l" cx="14" cy="80" rx="11" ry="26" fill="${DARK}" transform="rotate(12 14 80)"/>
    <ellipse class="wing wing-r" cx="106" cy="80" rx="11" ry="26" fill="${DARK}" transform="rotate(-12 106 80)"/>
    ${EYES[mood] || EYES.normal}
    <path class="beak" d="M52 58 h16 l-8 13z" fill="${BEAK}"/>
    <path d="M40 122 l-7 6 M44 123 v7 M48 122 l7 6 M72 122 l-7 6 M76 123 v7 M80 122 l7 6" stroke="${BEAK}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

export const OWL_NAME = "Cora";

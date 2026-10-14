// A mascote do app: uma coruja marrom desenhada em SVG, com três expressões.
// As classes são os ganchos das animações do CSS: eye (piscar), wing (bater asa)
// e beak (o bico de baixo, que abre conforme o volume da fala).

const BROWN = "#9a6532";
const DARK = "#6b4219";
const LIGHT = "#b7814a";
const BELLY = "#f1dcb4";
const BEAK = "#ff9600";

const EYES = {
  // Olhos abertos, olhando para a frente, com brilho.
  normal: `<circle cx="40" cy="48" r="17" fill="#fff"/><circle cx="80" cy="48" r="17" fill="#fff"/>
    <g class="eye"><circle cx="42" cy="50" r="8.5" fill="#2b1a0a"/><circle cx="45.5" cy="46" r="3" fill="#fff"/><circle cx="39" cy="54" r="1.2" fill="#fff"/></g>
    <g class="eye"><circle cx="78" cy="50" r="8.5" fill="#2b1a0a"/><circle cx="81.5" cy="46" r="3" fill="#fff"/><circle cx="75" cy="54" r="1.2" fill="#fff"/></g>`,
  // Olhos fechados em arco: contente.
  happy: `<circle cx="40" cy="48" r="17" fill="#fff"/><circle cx="80" cy="48" r="17" fill="#fff"/>
    <path d="M30 51 q10 -12 20 0" fill="none" stroke="#2b1a0a" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M70 51 q10 -12 20 0" fill="none" stroke="#2b1a0a" stroke-width="4.5" stroke-linecap="round"/>`,
  // Pálpebras caídas e olhar para baixo: triste.
  sad: `<circle cx="40" cy="48" r="17" fill="#fff"/><circle cx="80" cy="48" r="17" fill="#fff"/>
    <circle cx="42" cy="55" r="7" fill="#2b1a0a"/><circle cx="78" cy="55" r="7" fill="#2b1a0a"/>
    <path d="M22 50 l36 -9 v-21 h-36z" fill="${BROWN}"/><path d="M98 50 l-36 -9 v-21 h36z" fill="${BROWN}"/>`,
};

export function owl(mood = "normal", size = 120) {
  return `<svg class="owl mood-${mood}" width="${size}" height="${size}" viewBox="0 0 120 132" role="img" aria-label="Coruja, a mascote do app">
    <ellipse cx="60" cy="128" rx="34" ry="4" fill="#000" opacity="0.12"/>
    <path d="M20 28 l-7 -24 26 13z" fill="${DARK}"/><path d="M100 28 l7 -24 -26 13z" fill="${DARK}"/>
    <ellipse cx="60" cy="72" rx="49" ry="54" fill="${BROWN}"/>
    <path d="M96 34 q18 30 4 70 q-10 16 -26 20 q30 -34 22 -90z" fill="${DARK}" opacity="0.35"/>
    <path d="M30 22 q30 -12 60 0 q-30 -4 -60 0z" fill="${LIGHT}"/>
    <ellipse cx="60" cy="90" rx="31" ry="32" fill="${BELLY}"/>
    <path d="M45 80 q4 5 8 0 M67 80 q4 5 8 0 M56 93 q4 5 8 0 M43 102 q4 5 8 0 M69 102 q4 5 8 0 M56 111 q4 5 8 0" fill="none" stroke="${LIGHT}" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse class="wing wing-l" cx="13" cy="82" rx="11" ry="27" fill="${DARK}" transform="rotate(12 13 82)"/>
    <ellipse class="wing wing-r" cx="107" cy="82" rx="11" ry="27" fill="${DARK}" transform="rotate(-12 107 82)"/>
    <ellipse cx="22" cy="64" rx="7" ry="4" fill="#ff7a8a" opacity="0.45"/><ellipse cx="98" cy="64" rx="7" ry="4" fill="#ff7a8a" opacity="0.45"/>
    ${EYES[mood] || EYES.normal}
    <path class="beak" d="M53 68 h14 l-7 9z" fill="${BEAK}"/>
    <path d="M50 58 h20 l-10 12z" fill="${BEAK}"/><path d="M54 60 h6 l-3 4z" fill="#fff" opacity="0.5"/>
    <path d="M40 124 l-7 6 M44 125 v7 M48 124 l7 6 M72 124 l-7 6 M76 125 v7 M80 124 l7 6" stroke="${BEAK}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

export const OWL_NAME = "Cora";

// Efeitos visuais: entrada de telas, confete e números que sobem contando.
// Usam a Web Animations API, que roda fora do fluxo do CSS e some sozinha no fim.

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Faz um elemento "chegar": aparece subindo um pouco.
export function enter(el, { from = "translateY(14px)", duration = 220, delay = 0 } = {}) {
  if (!el?.animate || reduced()) return;
  el.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: "none" }], { duration, delay, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" });
}

// Entrada em cascata: cada filho chega um pouco depois do anterior.
export function stagger(list, step = 45) {
  [...list].slice(0, 14).forEach((el, i) => enter(el, { delay: i * step }));
}

export function pop(el) {
  if (!el?.animate || reduced()) return;
  el.animate([{ transform: "scale(.6)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" });
}

export function shake(el) {
  if (!el?.animate || reduced()) return;
  el.animate([0, -9, 9, -6, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 380 });
}

const COLORS = ["#58cc02", "#ffc800", "#1cb0f6", "#ff4b4b", "#ce82ff", "#ff9600"];

export function confetti(count = 60) {
  if (reduced() || !document.body.animate) return;
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  document.body.append(layer);
  const width = innerWidth;
  const height = innerHeight;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    const x = Math.random() * width;
    const drift = (Math.random() - 0.5) * 220;
    piece.style.cssText = `left:${x}px;background:${COLORS[i % COLORS.length]};width:${6 + Math.random() * 6}px;height:${8 + Math.random() * 8}px`;
    layer.append(piece);
    piece.animate(
      [
        { transform: "translate(0,-20px) rotate(0deg)", opacity: 1 },
        { transform: `translate(${drift}px,${height + 40}px) rotate(${360 + Math.random() * 720}deg)`, opacity: 0.9 },
      ],
      { duration: 1400 + Math.random() * 1200, delay: Math.random() * 350, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" },
    );
  }
  setTimeout(() => layer.remove(), 3200);
}

// Conta de 0 até o valor do elemento (o número precisa ser o texto do elemento, com prefixo opcional).
export function countUp(el, duration = 700) {
  if (!el || reduced()) return;
  const match = /^(\D*)(\d+)(.*)$/.exec(el.textContent);
  if (!match) return;
  const [, prefix, digits, suffix] = match;
  const target = Number(digits);
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = `${prefix}${Math.round(target * (1 - (1 - t) ** 3))}${suffix}`;
    if (t < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

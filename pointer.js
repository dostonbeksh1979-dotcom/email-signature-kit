// Signature Kit — pointer effects.
// A cursor ring that wraps buttons and shows short labels, sparks along the pointer's path,
// 3D tilt with glare on cards, hero letters that lift near the cursor, and click ripples.
// Ripples work everywhere; everything else needs a mouse or trackpad and the Ultra tier.
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const active = () => finePointer && !reduceMotion && root.classList.contains("q-ultra");

  // ---- Click ripples (all tiers) ----
  if (!reduceMotion) {
    document.addEventListener("pointerdown", (e) => {
      const target = e.target.closest(".btn, [role='tab'], .seg button, .quality button");
      if (!target) return;
      const r = target.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - r.left - size / 2}px`;
      ripple.style.top = `${e.clientY - r.top - size / 2}px`;
      target.append(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  if (!finePointer || reduceMotion) return;

  // ---- Cursor ring and dot ----
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = '<span class="cursor-label"></span>';
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.append(ring, dot);
  const label = ring.querySelector(".cursor-label");

  const INTERACTIVE = "a, button, label.swatch, .toggle, summary, [role='tab']";
  const pos = { x: -100, y: -100 };
  const ringBox = { x: -100, y: -100, w: 36, h: 36, r: 18 };
  let stuck = null;   // element the ring wraps (buttons and tabs)
  let stuckRadius = 12;
  let lastSpark = { x: 0, y: 0 };
  let visible = false;

  function onMove(e) {
    pos.x = e.clientX;
    pos.y = e.clientY;
    if (!visible) { visible = true; root.classList.add("has-cursor"); }

    const el = e.target.closest ? e.target : null;
    const hit = el && el.closest(INTERACTIVE);
    const field = el && el.closest(".field input");
    const nextStuck = hit && hit.matches(".btn, [role='tab'], .seg button, .quality button") ? hit : null;
    if (nextStuck && nextStuck !== stuck) stuckRadius = (parseFloat(getComputedStyle(nextStuck).borderRadius) || 7) + 5;
    stuck = nextStuck;
    ring.classList.toggle("is-hover", Boolean(hit) && !stuck);
    ring.classList.toggle("is-stuck", Boolean(stuck));
    ring.classList.toggle("is-text", Boolean(field));
    const text = el && el.closest("[data-cursor]");
    label.textContent = text ? text.dataset.cursor : "";
    ring.classList.toggle("has-label", Boolean(text) && !stuck);

    // Sparks along the path, spaced out so fast moves don't flood the canvas
    if (active() && window.FX && Math.hypot(pos.x - lastSpark.x, pos.y - lastSpark.y) > 14) {
      window.FX.spark(pos.x, pos.y);
      lastSpark = { x: pos.x, y: pos.y };
    }
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", () => { visible = false; root.classList.remove("has-cursor"); });
  document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  document.addEventListener("pointerup", () => ring.classList.remove("is-down"));

  // ---- Hero letters lift and grow near the cursor ----
  // Letter centres are measured once (page coordinates) and reused every frame, so the loop
  // never reads layout; they are re-measured when the pointer re-enters or the window resizes.
  const heroTitle = document.querySelector(".hero h1");
  const heroSection = document.querySelector(".hero");
  let overHero = false;
  let letters = [];

  function measureLetters() {
    letters = [...heroTitle.querySelectorAll(".ch")].map((c) => {
      c.style.translate = "";
      c.style.scale = "";
      const r = c.getBoundingClientRect();
      return { el: c, x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, k: 0 };
    });
  }
  heroSection.addEventListener("pointerenter", () => { overHero = true; measureLetters(); });
  heroSection.addEventListener("pointerleave", () => {
    overHero = false;
    letters.forEach((l) => { l.el.style.translate = ""; l.el.style.scale = ""; l.k = 0; });
  });
  window.addEventListener("resize", () => { if (overHero) measureLetters(); });

  function liftLetters() {
    const px = pos.x + window.scrollX;
    const py = pos.y + window.scrollY;
    letters.forEach((l) => {
      const k = Math.max(0, 1 - Math.hypot(px - l.x, py - l.y) / 160);
      if (Math.abs(k - l.k) < .01) return; // skip letters that didn't change
      l.k = k;
      l.el.style.translate = k ? `0 ${(-14 * k).toFixed(1)}px` : "";
      l.el.style.scale = k ? (1 + .14 * k).toFixed(3) : "";
    });
  }

  // ---- Loop: ring eases toward the pointer, or wraps the element it is stuck to ----
  const lerp = (a, b, t) => a + (b - a) * t;
  function frame() {
    if (active() && visible) {
      root.classList.add("cursor-on");
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      let tx = pos.x;
      let ty = pos.y;
      let tw = 36;
      let th = 36;
      let tr = 18;
      if (ring.classList.contains("has-label")) { tw = th = 78; tr = 39; }
      else if (ring.classList.contains("is-hover")) { tw = th = 56; tr = 28; }
      else if (ring.classList.contains("is-text")) { tw = 4; th = 30; tr = 2; }
      if (stuck) {
        const r = stuck.getBoundingClientRect();
        tw = r.width + 10;
        th = r.height + 10;
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
        tr = stuckRadius;
      }
      ringBox.x = lerp(ringBox.x, tx, .2);
      ringBox.y = lerp(ringBox.y, ty, .2);
      ringBox.w = lerp(ringBox.w, tw, .2);
      ringBox.h = lerp(ringBox.h, th, .2);
      ringBox.r = lerp(ringBox.r, tr, .2);
      ring.style.transform = `translate3d(${(ringBox.x - ringBox.w / 2).toFixed(1)}px, ${(ringBox.y - ringBox.h / 2).toFixed(1)}px, 0)`;
      ring.style.width = `${ringBox.w.toFixed(1)}px`;
      ring.style.height = `${ringBox.h.toFixed(1)}px`;
      ring.style.borderRadius = `${ringBox.r.toFixed(1)}px`;
      if (overHero) liftLetters();
    } else {
      root.classList.remove("cursor-on");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- 3D tilt with glare on cards ([data-tilt]) ----
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const strength = Number(card.dataset.tilt) || 8;
    card.addEventListener("pointermove", (e) => {
      if (!active()) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.rotate = `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${(Math.hypot(x, y) * strength).toFixed(2)}deg`;
      card.style.setProperty("--mx", `${((x + .5) * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${((y + .5) * 100).toFixed(1)}%`);
      card.classList.add("is-tilting");
    });
    card.addEventListener("pointerleave", () => {
      card.style.rotate = "";
      card.classList.remove("is-tilting");
    });
  });

  // ---- Buttons: a soft highlight that follows the pointer inside them ----
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--bx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--by", `${e.clientY - r.top}px`);
    });
  });
})();

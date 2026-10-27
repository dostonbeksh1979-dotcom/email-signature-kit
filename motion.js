// Signature Kit — text and scroll animations.
// Split headings, a rotating word, scrambled labels, a statement that lights up while scrolling,
// a pinned sideways inbox tour, hero parallax, the preview's entrance and the reading progress bar.
// Text and the inbox tour run in both quality tiers; parallax and 3D only in Ultra.
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 721px)");
  const isUltra = () => root.classList.contains("q-ultra");
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // ---- Text splitting: words or characters, keeping inner elements such as <em> or .grad-text ----
  function split(el, mode) {
    let index = 0;
    const walk = (node, isKey) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, isKey || child.tagName === "EM");
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
          const word = document.createElement("span");
          if (mode === "scrub") {
            word.className = isKey ? "sw key" : "sw";
            word.textContent = part;
          } else if (mode === "chars") {
            word.className = "w";
            [...part].forEach((ch) => {
              const c = document.createElement("span");
              c.className = "ch";
              c.textContent = ch;
              c.style.setProperty("--i", index++);
              word.append(c);
            });
          } else {
            word.className = "w";
            const inner = document.createElement("span");
            inner.className = "wi";
            inner.textContent = part;
            inner.style.setProperty("--i", index++);
            word.append(inner);
          }
          frag.append(word);
        });
        child.replaceWith(frag);
      });
    };
    walk(el, false);
    el.classList.add("is-split");
  }

  // ---- Rotating word in the hero chip ----
  function startRotator() {
    const box = document.querySelector(".rotator");
    if (!box) return;
    const words = ["Gmail", "Apple Mail", "iPhone", "Outlook"];
    let i = 0;
    const measure = document.createElement("span");
    measure.className = "rot-word rot-measure";
    box.append(measure);
    const widthOf = (text) => { measure.textContent = text; return measure.offsetWidth; };
    box.style.width = `${widthOf(words[0])}px`;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % words.length;
      const old = box.querySelector(".rot-word:not(.leave):not(.rot-measure)");
      const next = document.createElement("span");
      next.className = "rot-word enter";
      next.textContent = words[i];
      box.style.width = `${widthOf(words[i])}px`;
      box.append(next);
      if (old) {
        old.classList.add("leave");
        setTimeout(() => old.remove(), 600);
      }
    }, 2200);
  }

  // ---- Labels that decode from random letters ----
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=";
  function scramble(el) {
    const final = el.dataset.text;
    let frame = 0;
    const tick = () => {
      frame += 1;
      const revealed = Math.floor(frame / 2);
      el.textContent = [...final].map((ch, i) => (
        i < revealed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      )).join("");
      if (revealed < final.length) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    tick();
  }

  // ---- Set up text effects (skipped entirely for reduced motion) ----
  const hero = document.querySelector("[data-split='chars']");
  const statement = document.querySelector("[data-scrub]");
  let scrubWords = [];

  if (!reduceMotion) {
    split(hero, "chars");
    // The gradient needs one continuous text run, so the letters are joined back after the entrance
    const grad = hero.querySelector(".grad-text");
    grad.classList.add("pre");
    const lastDelay = hero.querySelectorAll(".ch").length * 22 + 950;
    setTimeout(() => {
      grad.textContent = grad.textContent;
      grad.classList.remove("pre");
    }, lastDelay);

    document.querySelectorAll("[data-split='words']").forEach((el) => split(el, "words"));
    split(statement, "scrub");
    scrubWords = [...statement.querySelectorAll(".sw")];
    document.querySelectorAll("[data-scramble]").forEach((el) => {
      el.dataset.text = el.textContent;
      el.setAttribute("aria-label", el.textContent);
    });
    startRotator();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.matches("[data-scramble]")) scramble(el);
        else if (el.matches(".steps")) el.classList.add("play"); // install steps slide in once visible
        else el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: .2, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll("[data-split='words'], [data-scramble], .steps").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".steps").forEach((el) => el.classList.add("play"));
  }

  // ---- Inbox tour sizing: the section is as tall as the sideways distance to travel ----
  const inboxes = document.getElementById("inboxes");
  const pin = inboxes.querySelector(".pin");
  const track = document.getElementById("track");
  const dots = [...inboxes.querySelectorAll(".track-dots li")];
  let travel = 0;
  const pinned = () => wide.matches && !reduceMotion;

  function sizeTour() {
    inboxes.classList.toggle("is-pinned", pinned());
    if (!pinned()) {
      inboxes.style.height = "";
      track.style.transform = "";
      return;
    }
    travel = Math.max(0, track.scrollWidth - pin.clientWidth);
    inboxes.style.height = `${pin.offsetHeight + travel}px`;
  }

  // ---- One frame per scroll ----
  const header = document.querySelector(".site-header");
  const heroSection = document.querySelector(".hero");
  const preview = document.querySelector(".preview");
  let ticking = false;

  function render() {
    ticking = false;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    header.style.setProperty("--rp", (window.scrollY / max).toFixed(4));

    if (scrubWords.length) {
      const r = statement.getBoundingClientRect();
      const lit = Math.round(clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1) * scrubWords.length);
      scrubWords.forEach((w, i) => w.classList.toggle("lit", i < lit));
    }

    if (pinned()) {
      const r = inboxes.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - pin.offsetHeight), 0, 1);
      track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px, 0, 0)`;
      const active = Math.round(p * (dots.length - 1));
      dots.forEach((d, i) => d.classList.toggle("on", i === active));
    }

    if (isUltra() && !reduceMotion) {
      heroSection.style.setProperty("--hs", clamp(window.scrollY / heroSection.offsetHeight, 0, 1).toFixed(3));
      const pr = preview.getBoundingClientRect();
      preview.style.setProperty("--enter", clamp((vh - pr.top) / (vh * .55), 0, 1).toFixed(3));
    } else {
      heroSection.style.removeProperty("--hs");
      preview.style.removeProperty("--enter");
    }
  }

  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", () => { sizeTour(); requestFrame(); });
  wide.addEventListener("change", () => { sizeTour(); requestFrame(); });
  // Switching quality tiers changes what render() does, so redraw then too
  new MutationObserver(requestFrame).observe(root, { attributes: true, attributeFilter: ["class"] });
  document.fonts.ready.then(() => { sizeTour(); requestFrame(); });
  window.addEventListener("load", () => { sizeTour(); requestFrame(); });
  sizeTour();
  render();
})();

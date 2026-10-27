// Signature Kit — visual effects with adaptive quality.
// "Auto" starts in Ultra and measures the real frame rate. If it stays under 20 fps for two
// seconds, the page drops to Lite (static background, no blur, no tilt) and stays there.
// Visitors can also force Ultra or Lite; reduced-motion and data-saver settings start in Lite.
(function () {
  const root = document.documentElement;
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");
  const fpsLabel = document.getElementById("fps");
  const qualityButtons = document.querySelectorAll("[data-q]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  const MIN_FPS = 20;
  const autoStart = reduceMotion || saveData ? "lite" : "ultra";
  let mode = "auto";
  let tier = autoStart;
  let lowSeconds = 0;

  // ---- Quality tiers ----
  function applyTier(next) {
    tier = next;
    root.classList.toggle("q-ultra", tier === "ultra");
    root.classList.toggle("q-lite", tier === "lite");
    if (tier === "lite") resetInteractive();
    else resize();
  }

  function setMode(next) {
    mode = next;
    qualityButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.q === mode)));
    lowSeconds = 0;
    applyTier(mode === "auto" ? autoStart : mode);
    try { localStorage.setItem("sigkit-quality", mode); } catch (e) { /* ignore */ }
  }

  qualityButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.q)));

  // ---- Frame-rate meter (always on; it costs almost nothing) ----
  let frames = 0;
  let windowStart = performance.now();
  const startedAt = windowStart;
  function measure(now) {
    frames += 1;
    const elapsed = now - windowStart;
    if (elapsed < 1000) return;
    const fps = Math.round((frames * 1000) / elapsed);
    frames = 0;
    windowStart = now;
    fpsLabel.textContent = `${fps} fps · ${tier === "ultra" ? "Ultra" : "Lite"}`;
    if (mode !== "auto" || tier !== "ultra" || now - startedAt < 1500) return;
    lowSeconds = fps < MIN_FPS ? lowSeconds + 1 : 0;
    if (lowSeconds >= 2) applyTier("lite");
  }
  // A hidden tab pauses frames; don't count that as a slow device
  document.addEventListener("visibilitychange", () => {
    frames = 0;
    windowStart = performance.now();
    lowSeconds = 0;
  });

  // ---- Aurora + particles (Ultra only) ----
  const aurora = document.createElement("canvas");
  const actx = aurora.getContext("2d");
  let W = 0;
  let H = 0;
  let dpr = 1;
  let particles = [];
  const confetti = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const hexToRgb = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const blobs = [
    { rgb: hexToRgb(getComputedStyle(root).getPropertyValue("--glow").trim() || "#14b8a6"), x: .18, y: .2, r: .62, sx: .11, sy: .07, p: 0 },
    { rgb: hexToRgb("#7c5cff"), x: .82, y: .18, r: .55, sx: .08, sy: .1, p: 2 },
    { rgb: hexToRgb("#ff4d8d"), x: .6, y: .85, r: .5, sx: .1, sy: .06, p: 4 },
    { rgb: hexToRgb("#2f6bff"), x: .15, y: .8, r: .45, sx: .07, sy: .09, p: 1 }
  ];
  document.addEventListener("glow", (e) => { blobs[0].rgb = hexToRgb(e.detail); });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    aurora.width = 96;
    aurora.height = Math.max(54, Math.round((96 * H) / W));
    const count = Math.max(30, Math.min(90, Math.round((W * H) / 22000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: .3 + Math.random() * .7,
      r: .6 + Math.random() * 1.4,
      a: .15 + Math.random() * .45
    }));
  }

  function drawAurora(t, scroll) {
    const aw = aurora.width;
    const ah = aurora.height;
    actx.globalCompositeOperation = "source-over";
    actx.fillStyle = "#070b14";
    actx.fillRect(0, 0, aw, ah);
    actx.globalCompositeOperation = "lighter";
    blobs.forEach((b) => {
      const cx = (b.x + Math.sin(t * b.sx + b.p) * .12) * aw;
      const cy = (b.y + Math.cos(t * b.sy + b.p) * .1 - scroll * .25) * ah;
      const r = b.r * Math.max(aw, ah);
      const g = actx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},.42)`);
      g.addColorStop(1, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},0)`);
      actx.fillStyle = g;
      actx.fillRect(0, 0, aw, ah);
    });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(aurora, 0, 0, canvas.width, canvas.height);
  }

  function drawParticles(dt) {
    ctx.fillStyle = "#ffffff";
    particles.forEach((p) => {
      p.y -= dt * 12 * p.z;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      const x = (p.x + pointer.x * 22 * p.z) * dpr;
      const y = (p.y + pointer.y * 16 * p.z) * dpr;
      ctx.globalAlpha = p.a * p.z;
      ctx.beginPath();
      ctx.arc(x, y, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawConfetti(dt) {
    for (let i = confetti.length - 1; i >= 0; i -= 1) {
      const c = confetti[i];
      c.life -= dt;
      if (c.life <= 0) { confetti.splice(i, 1); continue; }
      c.vy += 900 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, c.life * 1.6);
      ctx.translate(c.x * dpr, c.y * dpr);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.s * dpr, -c.s * .5 * dpr, c.s * 2 * dpr, c.s * dpr);
      ctx.restore();
    }
  }

  // Confetti from a point on screen (used when copying); Lite skips it
  function burst(x, y) {
    if (tier !== "ultra") return;
    const glow = getComputedStyle(root).getPropertyValue("--glow").trim();
    const colors = [glow, "#7c5cff", "#ff4d8d", "#ffffff", "#fbbf24"];
    for (let i = 0; i < 46; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1;
      const speed = 260 + Math.random() * 420;
      confetti.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * 14,
        s: 3 + Math.random() * 3,
        life: .9 + Math.random() * .5,
        color: colors[i % colors.length]
      });
    }
  }

  // ---- Main loop ----
  let last = performance.now();
  function frame(now) {
    measure(now);
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (tier === "ultra") {
      pointer.x += (pointer.tx - pointer.x) * .06;
      pointer.y += (pointer.ty - pointer.y) * .06;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - H);
      drawAurora(now / 1000, window.scrollY / maxScroll);
      drawParticles(dt);
      drawConfetti(dt);
      heroCards.style.setProperty("--px", pointer.x.toFixed(3));
      heroCards.style.setProperty("--py", pointer.y.toFixed(3));
    }
    requestAnimationFrame(frame);
  }

  // ---- Pointer effects (Ultra, mouse or trackpad only) ----
  const heroCards = document.querySelector(".hero-cards");
  const stage = document.getElementById("stage");
  const mail = document.getElementById("mail");
  const magnets = document.querySelectorAll(".magnetic");
  const glassPanels = document.querySelectorAll(".glass");
  const interactive = () => tier === "ultra" && finePointer;

  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth - .5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  glassPanels.forEach((panel) => {
    panel.addEventListener("pointermove", (e) => {
      if (!interactive()) return;
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
      panel.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  stage.addEventListener("pointermove", (e) => {
    if (!interactive()) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mail.style.setProperty("--rx", `${((.5 - y) * 7).toFixed(2)}deg`);
    mail.style.setProperty("--ry", `${((x - .5) * 9).toFixed(2)}deg`);
    mail.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    mail.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  });
  stage.addEventListener("pointerleave", () => {
    mail.style.removeProperty("--rx");
    mail.style.removeProperty("--ry");
  });

  magnets.forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      if (!interactive()) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--tx", `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px`);
      btn.style.setProperty("--ty", `${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px`);
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.removeProperty("--tx");
      btn.style.removeProperty("--ty");
    });
  });

  function resetInteractive() {
    mail.style.removeProperty("--rx");
    mail.style.removeProperty("--ry");
    magnets.forEach((b) => { b.style.removeProperty("--tx"); b.style.removeProperty("--ty"); });
    heroCards.style.removeProperty("--px");
    heroCards.style.removeProperty("--py");
    confetti.length = 0;
  }

  // ---- Scroll reveal and count-up (both tiers; skipped for reduced motion) ----
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        const delay = Math.min(siblings.indexOf(el), 5) * 90;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add("in");
        // Hover effects should react at once, so the stagger delay is dropped after the reveal
        setTimeout(() => { el.style.transitionDelay = ""; }, delay + 1000);
        io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  if (!reduceMotion) {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 400);
    });
  }

  window.addEventListener("resize", () => { if (tier === "ultra") resize(); });
  window.FX = { burst };

  let saved = null;
  try { saved = localStorage.getItem("sigkit-quality"); } catch (e) { /* ignore */ }
  setMode(saved === "ultra" || saved === "lite" ? saved : "auto");
  requestAnimationFrame(frame);
})();

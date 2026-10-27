// Signature Kit — portfolio demo: the builder.
// Each design returns email-safe HTML: tables, inline styles, web-safe fonts and a hosted PNG logo.
// Visual effects live in fx.js; this file works without it.

const form = document.getElementById("details");
const render = document.getElementById("sig-render");
const code = document.getElementById("code");
const count = document.getElementById("count");
const meter = document.querySelector(".meter");
const meterFill = document.getElementById("meter-fill");
const status = document.getElementById("status");
const mail = document.getElementById("mail");
const customColor = document.getElementById("f-custom");
const GMAIL_LIMIT = 10000;

let design = "classic";
let accent = "#0d7f7d"; // colour used inside the signature (readable on white)

const esc = (text) => String(text).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

// Only http(s) links go into href; anything else is dropped
function safeUrl(value) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch (e) {
    return "";
  }
}
const prettyUrl = (href) => href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
const telHref = (phone) => phone.replace(/(?!^\+)[^\d]/g, "");

// The logo must be an absolute URL, otherwise it breaks once the signature leaves this page
const LOGO_URL = new URL("img/logo.png", window.location.href).href;

function values() {
  const v = Object.fromEntries(new FormData(form));
  return {
    name: (v.name || "").trim(),
    title: (v.title || "").trim(),
    company: (v.company || "").trim(),
    phone: (v.phone || "").trim(),
    email: (v.email || "").trim(),
    website: safeUrl(v.website || ""),
    cta: (v.cta || "").trim(),
    ctaLink: safeUrl(v.ctaLink || ""),
    logo: document.getElementById("f-logo").checked
  };
}

const FONT = "font-family:Arial,Helvetica,sans-serif;";
const logoImg = (size) => `<img src="${esc(LOGO_URL)}" width="${size}" height="${size}" alt="" style="display:block;border:0;width:${size}px;height:${size}px;">`;
const role = (v) => [v.title, v.company].filter(Boolean).map(esc).join(" · ");

function contactLines(v, color, sep) {
  const parts = [];
  if (v.phone) parts.push(`<a href="tel:${esc(telHref(v.phone))}" style="color:${color};text-decoration:none;">${esc(v.phone)}</a>`);
  if (v.email) parts.push(`<a href="mailto:${esc(v.email)}" style="color:${color};text-decoration:none;">${esc(v.email)}</a>`);
  if (v.website) parts.push(`<a href="${esc(v.website)}" style="color:${accent};text-decoration:none;">${esc(prettyUrl(v.website))}</a>`);
  return parts.join(sep);
}

const DESIGNS = {
  classic(v) {
    const logoCell = v.logo ? `<td style="padding:0 16px 0 0;vertical-align:top;">${logoImg(64)}</td>` : "";
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;${FONT}font-size:14px;line-height:20px;color:#333333;">
<tr>
${logoCell}<td style="padding:0 0 0 16px;vertical-align:top;border-left:2px solid ${accent};">
<span style="font-size:16px;line-height:22px;font-weight:bold;color:#222222;">${esc(v.name)}</span><br>
<span style="color:${accent};">${role(v)}</span><br>
<span style="font-size:13px;line-height:20px;">${contactLines(v, "#333333", "<br>")}</span>
</td>
</tr>
</table>`;
  },

  modern(v) {
    const logoCell = v.logo ? `<td style="padding:0 12px 0 0;vertical-align:middle;">${logoImg(44)}</td>` : "";
    const button = v.cta && v.ctaLink
      ? `<tr><td style="padding:12px 0 0 0;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;"><tr>
<td bgcolor="${accent}" style="background:${accent};border-radius:6px;">
<a href="${esc(v.ctaLink)}" style="display:inline-block;padding:9px 16px;${FONT}font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(v.cta)}</a>
</td></tr></table>
</td></tr>`
      : "";
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;${FONT}font-size:13px;line-height:19px;color:#444444;">
<tr><td style="padding:0 0 10px 0;border-bottom:3px solid ${accent};">
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;"><tr>
${logoCell}<td style="vertical-align:middle;">
<span style="font-size:18px;line-height:24px;font-weight:bold;color:#1a1a1a;">${esc(v.name)}</span><br>
<span style="color:#666666;">${role(v)}</span>
</td></tr></table>
</td></tr>
<tr><td style="padding:10px 0 0 0;">${contactLines(v, "#444444", ' <span style="color:#bbbbbb;">|</span> ')}</td></tr>
${button}
</table>`;
  },

  minimal(v) {
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;${FONT}font-size:13px;line-height:19px;color:#555555;">
<tr><td>
<span style="font-weight:bold;color:#222222;">${esc(v.name)}</span>${role(v) ? ` <span style="color:#999999;">—</span> ${role(v)}` : ""}<br>
${contactLines(v, "#555555", ' <span style="color:#bbbbbb;">·</span> ')}
</td></tr>
</table>`;
  }
};

function plainText(v) {
  return [v.name, [v.title, v.company].filter(Boolean).join(", "), v.phone, v.email, v.website && prettyUrl(v.website)]
    .filter(Boolean).join("\n");
}

// Replays the entrance animation on the signature (design or colour change, not while typing)
function swapAnimation() {
  render.classList.remove("swap");
  void render.offsetWidth;
  render.classList.add("swap");
}

function update() {
  const v = values();
  const html = DESIGNS[design](v);
  render.innerHTML = html;
  code.textContent = html;
  const n = html.length;
  count.textContent = `${n.toLocaleString("en-US")} / ${GMAIL_LIMIT.toLocaleString("en-US")}`;
  meterFill.style.setProperty("--v", Math.min(n / GMAIL_LIMIT, 1).toFixed(3));
  meter.classList.toggle("is-over", n > GMAIL_LIMIT);
  document.querySelector('[data-out="from"]').textContent = v.email ? `${v.name} <${v.email}>` : v.name;
  document.querySelectorAll("[data-client-sig]").forEach((el) => { el.innerHTML = html; });
  renderMinis(v);
}

// The three floating cards in the hero show every design with the current details
function renderMinis(v) {
  document.querySelectorAll("[data-mini]").forEach((el) => {
    el.innerHTML = DESIGNS[el.dataset.mini](v);
  });
}

// ---- Copy ----
async function copySignature() {
  const v = values();
  const html = DESIGNS[design](v);
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText(v)], { type: "text/plain" })
      })]);
      return true;
    } catch (e) { /* fall back to selecting the preview */ }
  }
  const range = document.createRange();
  range.selectNodeContents(render);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ }
  sel.removeAllRanges();
  return ok;
}

async function copyHtml() {
  const html = DESIGNS[design](values());
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(html); return true; } catch (e) { /* fall back */ }
  }
  const area = document.createElement("textarea");
  area.value = html;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ }
  area.remove();
  return ok;
}

function celebrate(btn, ok, okText, failText) {
  status.textContent = ok ? okText : failText;
  if (!ok) return;
  const label = btn.querySelector("span");
  const original = label.dataset.label || label.textContent;
  label.dataset.label = original;
  label.textContent = "Copied";
  btn.classList.add("is-done");
  const r = btn.getBoundingClientRect();
  if (window.FX) window.FX.burst(r.left + r.width / 2, r.top + r.height / 2);
  setTimeout(() => { label.textContent = original; btn.classList.remove("is-done"); }, 1800);
}

document.getElementById("copy-sig").addEventListener("click", async (e) => {
  celebrate(e.currentTarget, await copySignature(),
    "Signature copied. Paste it into your email app's signature settings.",
    "Couldn't copy automatically. Select the signature in the preview and press Ctrl+C.");
});
document.getElementById("copy-html").addEventListener("click", async (e) => {
  celebrate(e.currentTarget, await copyHtml(),
    "HTML code copied.",
    "Couldn't copy automatically. Open “View HTML” and copy the code from there.");
});

// ---- Form: typing redraws instantly; colour changes also recolour the page ----
function setGlow(color) {
  document.documentElement.style.setProperty("--glow", color);
  document.dispatchEvent(new CustomEvent("glow", { detail: color }));
}

form.addEventListener("input", (e) => {
  if (e.target.name === "accent") {
    accent = e.target.value;
    setGlow(e.target.dataset.glow);
    customColor.closest(".swatch").classList.remove("is-active");
    update();
    swapAnimation();
    return;
  }
  update();
});
customColor.addEventListener("input", () => {
  accent = customColor.value;
  form.querySelectorAll('input[name="accent"]').forEach((r) => { r.checked = false; });
  const swatch = customColor.closest(".swatch");
  swatch.classList.add("is-active");
  swatch.style.setProperty("--c", accent);
  setGlow(accent);
  update();
});
document.getElementById("f-logo").addEventListener("change", () => { update(); swapAnimation(); });

// ---- Tabs with a sliding indicator (used for designs and for install apps) ----
function setupTabs(list, onSelect) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const ind = list.querySelector(".tab-ind, .app-ind");
  const place = (tab) => {
    ind.style.setProperty("--x", `${tab.offsetLeft}px`);
    ind.style.setProperty("--w", `${tab.offsetWidth}px`);
  };
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    place(tab);
    onSelect(tab);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      select(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  const current = () => tabs.find((t) => t.getAttribute("aria-selected") === "true");
  // The indicator previews the hovered tab and slides back when the pointer leaves
  tabs.forEach((tab) => tab.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") place(tab); }));
  list.addEventListener("pointerleave", () => place(current()));
  window.addEventListener("resize", () => place(current()));
  document.fonts.ready.then(() => place(current()));
  place(current());
  onSelect(current());
}

setupTabs(document.querySelector(".tabs"), (tab) => {
  mail.setAttribute("aria-labelledby", tab.id);
  if (design === tab.dataset.design) return;
  design = tab.dataset.design;
  update();
  swapAnimation();
});

// ---- Light / dark inbox preview ----
document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    mail.classList.toggle("is-dark", btn.dataset.mode === "dark");
  });
});

// ---- Install steps per email app ----
const STEPS = {
  gmail: [
    "Open Gmail, click the <b>gear icon</b>, then <b>See all settings</b>.",
    "On the <b>General</b> tab, scroll to <b>Signature</b> and click <b>Create new</b>.",
    "Paste into the box with <b>Ctrl+V</b> (or <b>Cmd+V</b> on a Mac).",
    "Under <b>Signature defaults</b>, choose it for new emails and replies.",
    "Scroll to the bottom and click <b>Save Changes</b>."
  ],
  apple: [
    "Open Mail, then <b>Mail → Settings → Signatures</b>.",
    "Select your account and click <b>+</b>.",
    "Untick <b>Always match my default message font</b>, otherwise Mail removes the formatting.",
    "Paste into the right-hand box and close the window.",
    "Logo shows as a question mark? Check you're online: it loads from the web, so it isn't sent as an attachment."
  ],
  iphone: [
    "Open this page on your iPhone and tap <b>Copy signature</b>.",
    "Go to <b>Settings → Apps → Mail → Signature</b> and paste.",
    "If the formatting disappears, <b>shake the iPhone</b> straight after pasting and tap <b>Undo</b>. The formatted version comes back."
  ],
  outlook: [
    "Open <b>Settings → Account → Signatures</b>.",
    "Click <b>New signature</b>, give it a name and paste.",
    "Choose it as the default for new messages and replies, then click <b>Save</b>."
  ]
};
const stepsList = document.getElementById("steps");
setupTabs(document.querySelector(".app-tabs"), (tab) => {
  stepsList.setAttribute("aria-labelledby", tab.id);
  // STEPS is our own fixed markup, not user input
  stepsList.innerHTML = STEPS[tab.dataset.app].map((s, i) => `<li style="--i:${i}">${s}</li>`).join("");
});

update();

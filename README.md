# Email Signature Kit (portfolio demo)

A small tool for making HTML email signatures that display correctly in Gmail, Apple Mail, iPhone and Outlook. Fill in your details, pick one of three designs, and copy the signature or its HTML code.

**Live demo:** https://dostonbeksh1979-dotcom.github.io/email-signature-kit/

## What it shows

- Adaptive visual quality: "Auto" starts in Ultra (live aurora background, glass panels, 3D tilt, magnetic buttons, confetti on copy) and measures the real frame rate. If it stays under 20 fps for two seconds, the page switches to Lite (static background, no blur). Visitors can also force Ultra or Lite; reduced-motion and data-saver settings start in Lite
- Text and scroll motion: the hero headline builds letter by letter, section headings rise word by word, labels decode from random letters, a statement lights up as you scroll, and a pinned "every inbox" tour slides your signature sideways through Gmail, Apple Mail, iPhone and Outlook (dark mode) mock-ups
- Pointer effects (mouse and trackpad, Ultra tier): a cursor ring that wraps buttons and shows short labels, sparks along the pointer's path, a background glow that follows the pointer, 3D tilt with glare on cards, hero letters that lift near the cursor, a tab indicator that previews the hovered tab, and click ripples
- Three designs (Classic, Modern with a button, Minimal), redrawn live as you type
- **Copy signature** puts formatted HTML on the clipboard, so it pastes straight into an email app's signature settings
- **Copy HTML code** for apps that take raw HTML
- A character counter for Gmail's 10,000-character signature limit
- A dark-mode preview, close to what dark inboxes do to an email
- Step-by-step install guides for Gmail, Apple Mail, iPhone and Outlook

## Why the signatures don't break

- Layout uses tables and inline styles only, the method every email client supports
- The logo is a hosted PNG with fixed width and height, so it isn't sent as an attachment
- Web-safe fonts (Arial, Helvetica); Outlook ignores web fonts
- Phone and email are `tel:` and `mailto:` links
- The logo sits on a solid circle, so it stays visible in dark mode

## Files

- `index.html`: page structure and install guides
- `styles.css`: page design
- `app.js`: signature designs, live preview, copy buttons, install steps
- `fx.js`: frame-rate meter, quality tiers, canvas aurora and particles, tilt, magnetic buttons, scroll reveals
- `motion.js`: split-text animations, rotating word, scrambled labels, scroll-lit statement, pinned inbox tour, hero parallax, reading progress
- `pointer.js`: custom cursor, pointer sparks, card tilt, letter lift, button highlight, click ripples
- `img/logo.png`: demo logo (fictional brand)

No framework and no build step. The person and contact details in the example are fictional.

Built by Dostonbek S.

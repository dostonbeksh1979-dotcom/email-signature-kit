# Email Signature Kit (portfolio demo)

A small tool for making HTML email signatures that display correctly in Gmail, Apple Mail, iPhone and Outlook. Fill in your details, pick one of three designs, and copy the signature or its HTML code.

**Live demo:** https://dostonbeksh1979-dotcom.github.io/email-signature-kit/

## What it shows

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
- `app.js`: signature designs, live preview, copy buttons
- `img/logo.png`: demo logo (fictional brand)

No framework and no build step. The person and contact details in the example are fictional.

Built by Dostonbek S.

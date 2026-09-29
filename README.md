# DineAgain

A small, responsive, four-section restaurant marketing website. Plain HTML, CSS and JavaScript with a Vercel function for consultation requests. No runtime dependencies, tracking scripts or invented testimonials. Palette: cream `#F4F0E5`, forest `#263D2C`, terracotta `#C66C49`, sage `#E1E7D7`.

## Run and verify

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173`. `npm run dev` serves the source instead.

## Activate consultations

All three consultation links open the same three-step dialog, based on LeadRevive: restaurant questions → preferred date/time → contact details. Choices cover the next fourteen weekdays, with half-hour slots from 09:00 to 18:00 in the visitor's timezone. These are requested times, not live availability or guaranteed reservations. The team confirms each meeting manually.

In the **DineAgain** Vercel project, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` under Settings → Environment Variables, using the same bot/chat values as LeadRevive. Set them for Production (and Preview if wanted), then redeploy. Credentials must never appear in browser code or Git. The `.env.example` lists the variable names without values. The local preview reads the same variables from its process environment; Node's `--env-file` option can load a local ignored `.env` file.

The server validates all fields, date/time and timezone, rejects honeypot submissions, and sends a DineAgain-branded message to Telegram. Success appears only after Telegram reports acceptance. Missing configuration disables submission with an honest notice; errors preserve the entered details. Requests are not stored in a database, and no automatic email/calendar invitation is sent. Tests mock Telegram and send no real messages.

Optional: `site-config.js` can override the built-in form with an HTTPS `bookingUrl` or `contactEmail`; leave both empty to use the form.

## Add the video

Replace the `.video-placeholder` element in `index.html` with your captioned video or an accessible embed. Keep the surrounding section and its accessible heading; give an iframe a descriptive title or supply captions with a native video element. The current placeholder deliberately has no clickable play control or invented runtime.

## Deploy

The site is static and works at a domain root or in a repository subpath.

### Vercel

Import this repository with root directory `./` and Application Preset **Other**. The checked-in `vercel.json` sets the build command and static output directory; Vercel also deploys `api/consultation.js` as a server function. Leave dashboard build overrides disabled and deploy the latest `main` commit. Set the two Telegram environment variables above to activate submissions. If an older deployment failed, deploy the new commit instead of retrying its old source.

### Other hosting options

The marketing page can still be hosted statically, but the built-in form requires `/api/consultation`. For static-only hosts such as GitHub Pages, configure a real external booking URL or contact email in `site-config.js` instead. For the full integrated flow, use Vercel.

Publishing the repository does not itself enable hosting. Configure the real consultation destination before promoting the site. If connecting a custom domain later, follow the selected host’s domain setup and HTTPS instructions; no custom domain or DNS change is included here.

## Design and accessibility

Exactly four content sections: hero, video placeholder, offer, final consultation. The booking dialog opens on demand, traps keyboard focus natively, closes with Escape, returns focus to its opener and preserves details when navigating between steps. System fonts avoid downloads. Reduced-motion preferences disable animation. The build validates the section count, checks for displayed service pricing and checks JavaScript syntax before copying public assets. Server credentials and the Telegram handler are never included in the public build.

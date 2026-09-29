# DineAgain

A small, responsive, four-section restaurant marketing website. Plain HTML, CSS and JavaScript; no third-party requests, runtime dependencies, tracking scripts or invented testimonials. Palette: cream `#F4F0E5`, forest `#263D2C`, terracotta `#C66C49`, sage `#E1E7D7`.

## Run and verify

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173`. `npm run dev` serves the source instead.

## Activate consultations

Edit `site-config.js`: set `bookingUrl` to your real HTTPS scheduling URL, or set `contactEmail` to your real email address. Booking takes precedence if both are set. All three consultation links update together. Until configured, they lead to the clearly labeled “Consultation booking opens soon” message. There is no simulated calendar, form submission, or confirmation.

## Add the video

Replace the `.video-placeholder` element in `index.html` with your captioned video or an accessible embed. Keep the surrounding section and its accessible heading; give an iframe a descriptive title or supply captions with a native video element. The current placeholder deliberately has no clickable play control or invented runtime.

## Deploy

The site is static and works at a domain root or in a repository subpath.

### Vercel

Import this repository with root directory `./` and Application Preset **Other**. This is correct: the site uses plain HTML/CSS/JavaScript, not Next.js. The checked-in `vercel.json` explicitly sets the build command, skips unnecessary dependency installation, and publishes only `dist/`. Leave dashboard build overrides disabled and deploy the latest `main` commit. No environment variables are required. If an older deployment failed, deploy the new commit instead of retrying its old source.

### Other hosting options

1. **GitHub Pages:** in this repository’s Settings → Pages, choose “Deploy from a branch”, branch `main`, folder `/ (root)`, and save. GitHub will display the live URL once deployment finishes. No workflow or build service is required.
2. **Other static hosting:** run `npm run build` and publish the contents of `dist/`. Build command: `npm run build`; output directory: `dist`.

Publishing the repository does not itself enable hosting. Configure the real consultation destination before promoting the site. If connecting a custom domain later, follow the selected host’s domain setup and HTTPS instructions; no custom domain or DNS change is included here.

## Design and accessibility

Exactly four content sections: hero, video placeholder, offer, final consultation. System sans-serif and Georgia keep the page light and avoid font downloads. Mobile layout stacks naturally; keyboard focus and skip navigation are visible; reduced-motion preferences disable animation. The build validates the section count, checks for displayed pricing and checks JavaScript syntax before copying the five public assets.

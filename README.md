# Web project estimate calculator (Next.js)

A Next.js (App Router) version of the freelance web project pricing calculator. Same functionality as the plain HTML build, restructured into React components with `page.js` / `layout.js` conventions.

## Project structure

```
estimate-nextjs/
├── app/
│   ├── layout.js       root layout — fonts, metadata, imports globals.css
│   ├── page.js          entry point — renders the calculator
│   └── globals.css      theme and layout styles
├── components/
│   └── EstimateCalculator.js   all interactive logic and markup
├── lib/
│   └── rates.js          pricing constants + the pure pricing calculation
├── package.json
└── next.config.js
```

## Setup

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Build for production

```bash
npm run build
npm start
```

## How it's organized

- **`lib/rates.js`** — default pricing data and the `computeQuote()` function. Pure logic, no React, easy to unit test independently if you want to add tests later.
- **`components/EstimateCalculator.js`** — a client component (`'use client'`) holding all form state, saved-estimate history, and rate customization. This is where nearly all the logic lives.
- **`app/page.js`** — deliberately thin; just renders `<EstimateCalculator />`. Keeps the route file simple if you later want to add more routes (e.g. `/history`, `/settings` as their own pages).
- **`app/layout.js`** — shared shell: fonts and page metadata.

## Data & privacy

Same as the HTML version — custom rates and saved estimates are stored in the browser's `localStorage`, client-side only. Nothing is sent to a server.

## Deploying

The easiest path is [Vercel](https://vercel.com) (built by the Next.js team — connect the repo, zero config needed). Also works on Netlify, or any Node host that supports `next start`.

## Notes

- Built on Next.js 14.2.35 (patched release addressing the Dec 2025 React Server Components CVEs). If you later upgrade, check [nextjs.org/blog](https://nextjs.org/blog) for the current recommended version.
- No external UI libraries — plain CSS in `globals.css`, same visual design as the original build.

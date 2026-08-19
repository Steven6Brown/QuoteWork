![Quotework](./banner.png)

# Quotework

A pricing calculator and invoice generator for freelance web design and development work, built by [Aquila Digital](https://github.com/Steven6Brown). Configure your own rates once, build itemized client estimates in seconds, and generate professional PDF invoices — all without a backend or database.

**Live app:** _add your Vercel URL here once deployed_

## Features

- **Configurable pricing** — set your own rates for project types, custom features, add-ons, extra pages, revisions, and rush delivery. Nothing is hardcoded; everything adjusts to your market.
- **Itemized estimates** — build a client quote by selecting project scope, with a live-updating total range and deposit calculation.
- **Hosting & ongoing management choice** — each estimate reflects whether the client manages their own hosting (with a launch & handoff fee) or you manage it ongoing (setup fee + monthly retainer), so pricing reflects what you're actually taking on.
- **One unified record** — an estimate and its eventual invoice are the same record, not two disconnected lists. Save a draft, keep editing it, and generate an invoice from it whenever you're ready.
- **PDF invoice generation** — auto-numbered, branded invoices with your business info, payment terms (Due on receipt / Net 15 / Net 30), and automatic due-date calculation.
- **Folder-aware saving** — on Chrome/Edge, connect a folder once via the File System Access API and every invoice saves there directly, no repeated download dialogs. Falls back to a normal download everywhere else.
- **Manual invoice-number control** — invoice numbers never auto-reset (reusing numbers causes real bookkeeping problems), but you can manually set the next number when you know it's safe to.
- **Saved estimates & invoices panel** — browse, reload, or delete past records, with invoice status shown inline.
- **Print / copy / export** — print-friendly estimate view and one-click copy-as-text for quick email quotes.
- **Local-only data** — everything (rates, business info, saved estimates, invoice history) lives in the browser's `localStorage`. No server, no database, no client data ever leaves the browser it's used in.

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- React (client components, `useState`/`useEffect`, no external state library)
- [jsPDF](https://github.com/parallax/jsPDF) for invoice generation
- Plain CSS (no framework) — custom "ledger" theme with light/dark mode support
- File System Access API (progressive enhancement, Chrome/Edge)

## Project structure

```
quotework/
├── app/
│ ├── layout.js root layout — fonts, metadata
│ ├── page.js entry point
│ └── globals.css theme, layout, print styles
├── components/
│ ├── EstimateCalculator.js orchestrator — state & handlers
│ ├── ClientProjectPanel.js
│ ├── ProjectScopePanel.js
│ ├── RateSettingsPanel.js
│ ├── BusinessInfoPanel.js
│ ├── SavedEstimatesPanel.js
│ ├── InvoicesPanel.js
│ └── EstimateSheet.js
├── lib/
│ ├── rates.js pricing constants & quote calculation
│ └── invoice.js PDF generation & save/delete logic
├── package.json
└── next.config.js
```


## Getting started

```bash
git clone https://github.com/Steven6Brown/QuoteWork.git
cd QuoteWork
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for production

```bash
npm run build
npm start
```

## Deploying

Deployed on [Vercel](https://vercel.com) — connect the repo and it auto-detects Next.js with zero config. Every push to `main` redeploys automatically.

## Data & privacy

No backend, no database, no analytics. Rates, business info, and every saved estimate/invoice live entirely in your browser's `localStorage`. Clearing your browser data clears this app's data too — there's no cloud backup.

## License

MIT — use, modify, and share freely.

---

Built by [Aquila Digital](https://github.com/Steven6Brown) · *Per Aspera Ad Astra*

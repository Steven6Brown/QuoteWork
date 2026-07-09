export const DEFAULT_RATES = {
  types: {
    basic: { label: 'Basic site', low: 1200, high: 2500 },
    business: { label: 'Business + custom features', low: 2500, high: 6000 },
    advanced: { label: 'Advanced / web app', low: 6000, high: 12000 },
  },
  page: { low: 100, high: 150 },
  features: [
    { id: 'booking', label: 'Booking / scheduling', low: 500, high: 1000 },
    { id: 'ecommerce', label: 'E-commerce store', low: 1500, high: 4000 },
    { id: 'forms', label: 'Custom forms / calculators', low: 300, high: 800 },
    { id: 'api', label: 'API integrations', low: 500, high: 1500 },
    { id: 'portal', label: 'Member portal / login', low: 800, high: 2000 },
    { id: 'animation', label: 'Custom animations', low: 300, high: 800 },
  ],
  addons: [
    { id: 'copy', label: 'Copywriting', low: 300, high: 800 },
    { id: 'brand', label: 'Logo / branding', low: 300, high: 1000 },
  ],
  revision: 150,
  rushPct: 20,
  depositPct: 50,
  mult: [0.7, 1.0, 1.3, 1.7],
  hosting: {
    client: { label: 'Client manages hosting', sub: 'Launch & handoff fee', low: 200, high: 400 },
    managed: { label: 'I manage hosting ongoing', sub: 'One-time setup fee', low: 100, high: 250 },
  },
};

export const EXP_LABELS = ['New freelancer', 'Some experience', 'Experienced', 'Expert / specialist'];

export function fmt(n) {
  return '$' + Math.round(n).toLocaleString();
}

export function computeQuote(rates, formState) {
  const { typeVal, extraPages, extraRevisions, features, addons, rush, expIndex, hostingChoice } = formState;
  const t = rates.types[typeVal];
  let low = t.low;
  let high = t.high;
  const lines = [{ label: t.label, low: t.low, high: t.high }];

  if (extraPages > 0) {
    const pl = extraPages * rates.page.low;
    const ph = extraPages * rates.page.high;
    lines.push({ label: `${extraPages} extra page${extraPages > 1 ? 's' : ''}`, low: pl, high: ph });
    low += pl;
    high += ph;
  }

  rates.features.forEach((f) => {
    if (features[f.id]) {
      lines.push({ label: f.label, low: f.low, high: f.high });
      low += f.low;
      high += f.high;
    }
  });

  rates.addons.forEach((a) => {
    if (addons[a.id]) {
      lines.push({ label: a.label, low: a.low, high: a.high });
      low += a.low;
      high += a.high;
    }
  });

  if (extraRevisions > 0) {
    const rv = extraRevisions * rates.revision;
    lines.push({ label: `${extraRevisions} extra revision round${extraRevisions > 1 ? 's' : ''}`, low: rv, high: rv });
    low += rv;
    high += rv;
  }

  if (hostingChoice && rates.hosting[hostingChoice]) {
    const h = rates.hosting[hostingChoice];
    lines.push({ label: `${h.sub} (${h.label})`, low: h.low, high: h.high });
    low += h.low;
    high += h.high;
  }

  const mult = rates.mult[expIndex];
  if (mult !== 1) {
    const adjLow = low * mult - low;
    const adjHigh = high * mult - high;
    lines.push({ label: `Rate adjustment (${EXP_LABELS[expIndex]})`, low: adjLow, high: adjHigh });
    low *= mult;
    high *= mult;
  }

  if (rush) {
    const factor = 1 + rates.rushPct / 100;
    const rl = low * factor - low;
    const rh = high * factor - high;
    lines.push({ label: `Rush delivery (+${rates.rushPct}%)`, low: rl, high: rh });
    low *= factor;
    high *= factor;
  }

  return { lines, low, high };
}

/**
 * Merges rates loaded from localStorage with DEFAULT_RATES so that any
 * fields added in a later version of the app (like `hosting`) are always
 * present, even if the person has old saved data from before that field
 * existed. Without this, a stale localStorage entry can leave a whole
 * section undefined and crash the app.
 */
export function mergeWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return JSON.parse(JSON.stringify(DEFAULT_RATES));
  return {
    types: { ...DEFAULT_RATES.types, ...(saved.types || {}) },
    page: { ...DEFAULT_RATES.page, ...(saved.page || {}) },
    features: Array.isArray(saved.features) ? saved.features : DEFAULT_RATES.features,
    addons: Array.isArray(saved.addons) ? saved.addons : DEFAULT_RATES.addons,
    revision: saved.revision ?? DEFAULT_RATES.revision,
    rushPct: saved.rushPct ?? DEFAULT_RATES.rushPct,
    depositPct: saved.depositPct ?? DEFAULT_RATES.depositPct,
    mult: Array.isArray(saved.mult) ? saved.mult : DEFAULT_RATES.mult,
    hosting: { ...DEFAULT_RATES.hosting, ...(saved.hosting || {}) },
  };
}

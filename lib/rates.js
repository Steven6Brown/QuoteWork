export const RATES_VERSION = 2;

// Ongoing website management plans (billed separately from the project total)
export const MAINT_PLANS = {
  monthly: { label: 'Monthly', amount: 20, unit: 'per month' },
  annual: { label: 'Annual', amount: 200, unit: 'per year', note: 'saves $40' },
};

export function maintText(planKey) {
  const p = MAINT_PLANS[planKey] || MAINT_PLANS.monthly;
  return `$${p.amount} ${p.unit}`;
}

export const DEFAULT_RATES = {
  ratesVersion: RATES_VERSION,
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
    managed: { label: 'I manage hosting ongoing', sub: 'Setup fee', low: 0, high: 0 },
  },
};

export const EXP_LABELS = ['New freelancer', 'Some experience', 'Experienced', 'Expert / specialist'];

export function fmt(n) {
  const rounded = Math.round(n);
  return (rounded < 0 ? '-' : '') + '$' + Math.abs(rounded).toLocaleString();
}

// Shows a single figure when the range collapses (e.g. custom-only invoices)
export function fmtRange(low, high) {
  if (Math.round(low) === Math.round(high)) return fmt(low);
  return low < 0 || high < 0 ? `${fmt(low)} to ${fmt(high)}` : `${fmt(low)}–${fmt(high)}`;
}

// Custom lines hold `amount` as a string while the person is typing (so a
// lone "-" is allowed mid-edit); rows with no label and no amount are ignored.
export function usableCustomLines(customLines) {
  return (customLines || [])
    .map((c) => ({ label: (c.label || '').trim(), amount: parseFloat(c.amount) || 0 }))
    .filter((c) => c.label || c.amount);
}

export function computeQuote(rates, formState) {
  const { typeVal, extraPages, extraRevisions, features, addons, rush, expIndex, hostingChoice, maintPlan, customLines, customOnly } = formState;
  const custom = usableCustomLines(customLines);

  // Custom-only mode: the invoice shows exactly the lines the person typed,
  // skipping the package calculator entirely.
  if (customOnly) {
    const total = custom.reduce((sum, c) => sum + c.amount, 0);
    return {
      lines: custom.map((c) => ({ label: c.label || 'Custom item', low: c.amount, high: c.amount })),
      low: total,
      high: total,
    };
  }

  // typeVal 'none' = no website package (e.g. a management-only invoice)
  const t = rates.types[typeVal];
  let low = t ? t.low : 0;
  let high = t ? t.high : 0;
  const lines = t ? [{ label: t.label, low: t.low, high: t.high }] : [];

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

  if (hostingChoice && rates.hosting[hostingChoice] && (rates.hosting[hostingChoice].low || rates.hosting[hostingChoice].high)) {
    const h = rates.hosting[hostingChoice];
    lines.push({ label: `${h.sub} (${h.label})`, low: h.low, high: h.high });
    low += h.low;
    high += h.high;
  }

  const mult = rates.mult[expIndex];
  if (mult !== 1 && (low || high)) {
    const adjLow = low * mult - low;
    const adjHigh = high * mult - high;
    // invoiceLabel keeps the experience level (internal pricing info) off client invoices
    lines.push({ label: `Rate adjustment (${EXP_LABELS[expIndex]})`, invoiceLabel: 'Rate adjustment', low: adjLow, high: adjHigh });
    low *= mult;
    high *= mult;
  }

  if (rush && (low || high)) {
    const factor = 1 + rates.rushPct / 100;
    const rl = low * factor - low;
    const rh = high * factor - high;
    lines.push({ label: `Rush delivery (+${rates.rushPct}%)`, low: rl, high: rh });
    low *= factor;
    high *= factor;
  }

  // With no website package, the management plan is the thing being billed,
  // so it becomes a real line (flat, never multiplied) instead of a side note.
  if (!t && hostingChoice === 'managed') {
    const plan = MAINT_PLANS[maintPlan] || MAINT_PLANS.monthly;
    lines.push({ label: `Website management, ${plan.label.toLowerCase()} plan`, low: plan.amount, high: plan.amount });
    low += plan.amount;
    high += plan.amount;
  }

  // Custom lines are flat amounts (discounts are negative), added after the
  // rate adjustment and rush fee so they are never multiplied.
  custom.forEach((c) => {
    lines.push({ label: c.label || 'Custom item', low: c.amount, high: c.amount });
    low += c.amount;
    high += c.amount;
  });

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
    // Older saved rates (before the $20/mo or $200/yr management plans) reset
    // the managed-hosting setup fee to the new default; later edits are kept.
    hosting: {
      ...DEFAULT_RATES.hosting,
      ...(saved.hosting || {}),
      ...(saved.ratesVersion === RATES_VERSION ? {} : { managed: DEFAULT_RATES.hosting.managed }),
    },
    ratesVersion: RATES_VERSION,
  };
}

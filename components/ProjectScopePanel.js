import { fmt, MAINT_PLANS } from '../lib/rates';

export default function ProjectScopePanel({
  rates, typeVal, setTypeVal, extraPages, setExtraPages, extraRevisions, setExtraRevisions,
  features, toggleFeature, addons, toggleAddon, rush, setRush,
  hostingChoice, setHostingChoice, maintPlan, setMaintPlan,
  customLines, setCustomLines, customOnly, setCustomOnly,
}) {
  const addCustomLine = () =>
    setCustomLines((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: '', amount: '' }]);
  const updateCustomLine = (id, field, value) =>
    setCustomLines((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const removeCustomLine = (id) => setCustomLines((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="panel">
      <h2>Project Scope</h2>

      <h3>Project type</h3>
      <div className="chip-grid">
        <label className={`chip type-chip${typeVal === 'none' ? ' active' : ''}`}>
          <input type="radio" name="type" value="none" checked={typeVal === 'none'} onChange={() => setTypeVal('none')} />
          <span className="chip-text">
            <span className="name">No website package</span>
            <span className="price">Management or custom lines only</span>
          </span>
        </label>
        {Object.entries(rates.types).map(([key, t]) => (
          <label key={key} className={`chip type-chip${typeVal === key ? ' active' : ''}`}>
            <input type="radio" name="type" value={key} checked={typeVal === key} onChange={() => setTypeVal(key)} />
            <span className="chip-text">
              <span className="name">{t.label}</span>
              <span className="price">{fmt(t.low)}&ndash;{fmt(t.high)}</span>
            </span>
          </label>
        ))}
      </div>

      <h3>Pages &amp; revisions</h3>
      <div className="field-row">
        <div>
          <label htmlFor="extra-pages">Extra pages beyond base</label>
          <input id="extra-pages" type="number" min="0" max="60" value={extraPages} onChange={(e) => setExtraPages(+e.target.value || 0)} />
        </div>
        <div>
          <label htmlFor="extra-revisions">Extra revision rounds</label>
          <input id="extra-revisions" type="number" min="0" max="20" value={extraRevisions} onChange={(e) => setExtraRevisions(+e.target.value || 0)} />
        </div>
      </div>

      <h3>Custom features</h3>
      <div className="chip-grid">
        {rates.features.map((f) => (
          <label key={f.id} className={`chip${features[f.id] ? ' active' : ''}`}>
            <input type="checkbox" checked={!!features[f.id]} onChange={() => toggleFeature(f.id)} />
            <span className="chip-text">
              <span className="name">{f.label}</span>
              <span className="price">{fmt(f.low)}&ndash;{fmt(f.high)}</span>
            </span>
          </label>
        ))}
      </div>

      <h3>Add-ons</h3>
      <div className="chip-grid">
        {rates.addons.map((a) => (
          <label key={a.id} className={`chip${addons[a.id] ? ' active' : ''}`}>
            <input type="checkbox" checked={!!addons[a.id]} onChange={() => toggleAddon(a.id)} />
            <span className="chip-text">
              <span className="name">{a.label}</span>
              <span className="price">{fmt(a.low)}&ndash;{fmt(a.high)}</span>
            </span>
          </label>
        ))}
      </div>

      <h3>Delivery</h3>
      <div className="chip-grid">
        <label className={`chip${rush ? ' active' : ''}`}>
          <input type="checkbox" checked={rush} onChange={() => setRush((r) => !r)} />
          <span className="chip-text">
            <span className="name">Rush delivery</span>
            <span className="price">+{rates.rushPct}% fee</span>
          </span>
        </label>
      </div>

      <h3>Hosting &amp; ongoing management</h3>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '-2px 0 8px' }}>
        Who&apos;s responsible for the site after launch changes what you&apos;re actually selling.
      </p>
      <div className="chip-grid">
        {Object.entries(rates.hosting).map(([key, h]) => (
          <label key={key} className={`chip${hostingChoice === key ? ' active' : ''}`}>
            <input type="radio" name="hosting" checked={hostingChoice === key} onChange={() => setHostingChoice(key)} />
            <span className="chip-text">
              <span className="name">{h.label}</span>
              <span className="price">{h.sub}: {fmt(h.low)}&ndash;{fmt(h.high)}</span>
            </span>
          </label>
        ))}
      </div>
      {hostingChoice && (
        <button type="button" className="ghost small" style={{ padding: '4px 0', marginTop: 4 }} onClick={() => setHostingChoice(null)}>
          Clear selection
        </button>
      )}
      {hostingChoice === 'managed' && (
        <div style={{ marginTop: 10 }}>
          <h3 style={{ marginTop: 0 }}>Management plan</h3>
          <div className="chip-grid">
            {Object.entries(MAINT_PLANS).map(([key, p]) => (
              <label key={key} className={`chip${maintPlan === key ? ' active' : ''}`}>
                <input type="radio" name="maint-plan" checked={maintPlan === key} onChange={() => setMaintPlan(key)} />
                <span className="chip-text">
                  <span className="name">{p.label}</span>
                  <span className="price">${p.amount} {p.unit}{p.note ? ` (${p.note})` : ''}</span>
                </span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Billed separately, not part of the one-time project total below.</p>
        </div>
      )}

      <h3>Custom line items</h3>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '-2px 0 8px' }}>
        Add any line with your own description and amount. Use a negative amount for a discount (for example -250).
      </p>
      {customLines.map((c, i) => (
        <div className="field-row" key={c.id} style={{ alignItems: 'end', marginBottom: 8 }}>
          <div style={{ flex: 2 }}>
            <label htmlFor={`custom-label-${c.id}`}>Description {i + 1}</label>
            <input
              id={`custom-label-${c.id}`}
              type="text"
              value={c.label}
              placeholder="Website design and development"
              onChange={(e) => updateCustomLine(c.id, 'label', e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor={`custom-amount-${c.id}`}>Amount ($)</label>
            <input
              id={`custom-amount-${c.id}`}
              type="number"
              step="any"
              value={c.amount}
              placeholder="0"
              onChange={(e) => updateCustomLine(c.id, 'amount', e.target.value)}
            />
          </div>
          <button type="button" className="ghost small" onClick={() => removeCustomLine(c.id)} aria-label={`Remove custom line ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="small" onClick={addCustomLine}>+ Add line</button>
      <label className="chip-text" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <input type="checkbox" checked={customOnly} onChange={() => setCustomOnly((v) => !v)} />
        <span>Use custom lines only (skip the package calculator above)</span>
      </label>
    </div>
  );
}

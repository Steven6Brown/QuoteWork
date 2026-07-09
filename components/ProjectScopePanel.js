import { fmt } from '../lib/rates';

export default function ProjectScopePanel({
  rates, typeVal, setTypeVal, extraPages, setExtraPages, extraRevisions, setExtraRevisions,
  features, toggleFeature, addons, toggleAddon, rush, setRush,
  hostingChoice, setHostingChoice, maintAmount, setMaintAmount,
}) {
  return (
    <div className="panel">
      <h2>Project Scope</h2>

      <h3>Project type</h3>
      <div className="chip-grid">
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
          <label htmlFor="maint-amount">Monthly retainer amount</label>
          <input id="maint-amount" type="range" min="100" max="500" step="25" value={maintAmount} onChange={(e) => setMaintAmount(+e.target.value)} style={{ width: '100%' }} />
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>${maintAmount}/mo — billed separately, not part of the one-time project total below.</p>
        </div>
      )}
    </div>
  );
}

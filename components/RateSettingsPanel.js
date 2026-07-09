// import { EXP_LABELS } from '../lib/rates'; // was only used by the disabled rate-level multipliers fieldset

export default function RateSettingsPanel({ rates, setRates, updateTypeRate, updateFeatureRate, updateAddonRate, updateMult, resetRates }) {
  return (
    <details>
      <summary>Customize your base rates</summary>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '6px 0 0' }}>
        Change any number to match your own market. Saved automatically in this browser.
      </p>

      <fieldset>
        <legend>Project type ranges ($)</legend>
        <div className="rate-head"><span></span><span>Low</span><span>High</span></div>
        {Object.entries(rates.types).map(([key, t]) => (
          <div className="rate-row" key={key}>
            <span>{t.label}</span>
            <input type="number" value={t.low} onChange={(e) => updateTypeRate(key, 'low', e.target.value)} />
            <input type="number" value={t.high} onChange={(e) => updateTypeRate(key, 'high', e.target.value)} />
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Per extra page ($)</legend>
        <div className="rate-head"><span></span><span>Low</span><span>High</span></div>
        <div className="rate-row">
          <span>Each extra page</span>
          <input type="number" value={rates.page.low} onChange={(e) => setRates((prev) => ({ ...prev, page: { ...prev.page, low: +e.target.value || 0 } }))} />
          <input type="number" value={rates.page.high} onChange={(e) => setRates((prev) => ({ ...prev, page: { ...prev.page, high: +e.target.value || 0 } }))} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Feature add prices ($)</legend>
        <div className="rate-head"><span></span><span>Low</span><span>High</span></div>
        {rates.features.map((f) => (
          <div className="rate-row" key={f.id}>
            <span>{f.label}</span>
            <input type="number" value={f.low} onChange={(e) => updateFeatureRate(f.id, 'low', e.target.value)} />
            <input type="number" value={f.high} onChange={(e) => updateFeatureRate(f.id, 'high', e.target.value)} />
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Add-on prices ($)</legend>
        <div className="rate-head"><span></span><span>Low</span><span>High</span></div>
        {rates.addons.map((a) => (
          <div className="rate-row" key={a.id}>
            <span>{a.label}</span>
            <input type="number" value={a.low} onChange={(e) => updateAddonRate(a.id, 'low', e.target.value)} />
            <input type="number" value={a.high} onChange={(e) => updateAddonRate(a.id, 'high', e.target.value)} />
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Hosting &amp; handoff ($)</legend>
        <div className="rate-head"><span></span><span>Low</span><span>High</span></div>
        {Object.entries(rates.hosting).map(([key, h]) => (
          <div className="rate-row" key={key}>
            <span>{h.label}</span>
            <input type="number" value={h.low} onChange={(e) => setRates((prev) => ({ ...prev, hosting: { ...prev.hosting, [key]: { ...prev.hosting[key], low: +e.target.value || 0 } } }))} />
            <input type="number" value={h.high} onChange={(e) => setRates((prev) => ({ ...prev, hosting: { ...prev.hosting, [key]: { ...prev.hosting[key], high: +e.target.value || 0 } } }))} />
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Other</legend>
        <div className="rate-row"><span>Per extra revision round</span><input type="number" value={rates.revision} onChange={(e) => setRates((p) => ({ ...p, revision: +e.target.value || 0 }))} /><span></span></div>
        <div className="rate-row"><span>Rush delivery fee (%)</span><input type="number" value={rates.rushPct} onChange={(e) => setRates((p) => ({ ...p, rushPct: +e.target.value || 0 }))} /><span></span></div>
        <div className="rate-row"><span>Deposit due (%)</span><input type="number" value={rates.depositPct} onChange={(e) => setRates((p) => ({ ...p, depositPct: +e.target.value || 0 }))} /><span></span></div>
      </fieldset>

      {/* Disabled along with the "Your rate level" panel — multiplier is now
          fixed at 1.0x, so editing these tiers has no effect. Adjust prices
          directly in the fieldsets above instead when you want to charge more.
      <fieldset>
        <legend>Rate-level multipliers</legend>
        {EXP_LABELS.map((label, i) => (
          <div className="rate-row" key={label}>
            <span>{label}</span>
            <input type="number" step="0.05" value={rates.mult[i]} onChange={(e) => updateMult(i, e.target.value)} />
            <span></span>
          </div>
        ))}
      </fieldset>
      */}

      <div className="btn-row">
        <button className="small" type="button" onClick={resetRates}>Reset to defaults</button>
      </div>
    </details>
  );
}

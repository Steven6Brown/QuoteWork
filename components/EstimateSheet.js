import { fmt } from '../lib/rates';
import { PAYMENT_TERMS } from '../lib/invoice';

export default function EstimateSheet({
  clientName, projectName, lines, low, high, depositLow, depositHigh,
  hostingChoice, maintAmount, saveFlash, onSave, copyFlash, onCopy,
  finalPrice, setFinalPrice, finalPriceTouched, setFinalPriceTouched,
  paymentTerms, setPaymentTerms, invoiceFlash, onDownloadInvoice,
  folderPickerSupported, folderName, onChooseFolder,
}) {
  return (
    <div className="sheet">
      <div className="sheet-header">
        <div className="who">
          <strong>{clientName || 'New estimate'}</strong>
          <span>{projectName}</span>
        </div>
        <div className="stamp">ESTIMATE</div>
      </div>

      <div>
        {lines.map((l, i) => (
          <div className="line" key={i}>
            <span className="l-label">{l.label}</span>
            <span className="l-price">{l.low === l.high ? fmt(l.low) : `${fmt(l.low)}\u2013${fmt(l.high)}`}</span>
          </div>
        ))}
      </div>

      <div className="totals">
        <div className="row grand"><span>Total quote</span><span>{fmt(low)}&ndash;{fmt(high)}</span></div>
        <div className="row sub"><span>Deposit due to start</span><span>{fmt(depositLow)}&ndash;{fmt(depositHigh)}</span></div>
      </div>

      {hostingChoice === 'managed' && (
        <div className="maint-note">
          <span>Plus monthly maintenance</span>
          <span>${maintAmount}/mo</span>
        </div>
      )}

      <div className="btn-row no-print">
        <button className="primary" type="button" onClick={onSave}>{saveFlash ? 'Saved' : 'Save estimate'}</button>
        <button type="button" onClick={() => window.print()}>Print / save PDF</button>
        <button type="button" onClick={onCopy}>{copyFlash ? 'Copied' : 'Copy as text'}</button>
      </div>

      <div className="maint-note no-print" style={{ marginTop: '1.25rem', paddingTop: '1rem', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generate invoice</span>

        <div className="field-row" style={{ marginBottom: 0 }}>
          <div>
            <label htmlFor="final-price">Final agreed price</label>
            <input
              id="final-price"
              type="number"
              value={finalPrice}
              onChange={(e) => { setFinalPrice(+e.target.value || 0); setFinalPriceTouched(true); }}
            />
          </div>
          <div>
            <label htmlFor="payment-terms">Payment terms</label>
            <select id="payment-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
              {Object.entries(PAYMENT_TERMS).map(([key, t]) => (
                <option key={key} value={key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        {finalPriceTouched && (
          <button type="button" className="ghost small" style={{ alignSelf: 'flex-start', padding: '2px 0' }} onClick={() => setFinalPriceTouched(false)}>
            Reset to midpoint ({fmt((low + high) / 2)})
          </button>
        )}

        <div className="btn-row" style={{ marginTop: 4 }}>
          <button className="primary" type="button" onClick={onDownloadInvoice}>
            {invoiceFlash || 'Download invoice (PDF)'}
          </button>
          {folderPickerSupported && (
            <button type="button" onClick={onChooseFolder}>
              {folderName ? `Folder: ${folderName}` : 'Choose invoices folder'}
            </button>
          )}
        </div>
        {!folderPickerSupported && (
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
            Invoices download to your browser&apos;s default Downloads folder.
          </span>
        )}
      </div>
    </div>
  );
}

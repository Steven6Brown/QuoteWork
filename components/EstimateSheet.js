import { fmt, fmtRange, maintText } from '../lib/rates';
import { PAYMENT_TERMS } from '../lib/invoice';

export default function EstimateSheet({
  clientName, projectName, lines, low, high, depositLow, depositHigh,
  hostingChoice, maintPlan, lineTotalMid, saveFlash, onSave, copyFlash, onCopy,
  finalPrice, setFinalPrice, finalPriceTouched, setFinalPriceTouched,
  paymentTerms, setPaymentTerms, invoiceType, setInvoiceType, invoiceFlash, onDownloadInvoice,
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
            <span className="l-price">{fmtRange(l.low, l.high)}</span>
          </div>
        ))}
      </div>

      <div className="totals">
        <div className="row grand"><span>Total quote</span><span>{fmtRange(low, high)}</span></div>
        <div className="row sub"><span>Deposit due to start</span><span>{fmtRange(depositLow, depositHigh)}</span></div>
      </div>

      {hostingChoice === 'managed' && (
        <div className="maint-note">
          <span>Plus ongoing website management</span>
          <span>{maintText(maintPlan)}</span>
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
        <div>
          <label htmlFor="invoice-type">Invoice type</label>
          <select id="invoice-type" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
            <option value="split">Deposit and balance (project invoice)</option>
            <option value="full">Pay in full (management or single payment)</option>
          </select>
        </div>
        {Math.abs(lineTotalMid - finalPrice) > 1 && (
          <p role="alert" style={{ fontSize: 12.5, color: 'var(--stamp, #a8412c)', margin: '2px 0 0' }}>
            The invoice lines add up to about {fmt(lineTotalMid)}, but Total due is {fmt(finalPrice)}. Tick &quot;Use custom lines only&quot; and enter your own lines, or adjust the final price.
          </p>
        )}
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

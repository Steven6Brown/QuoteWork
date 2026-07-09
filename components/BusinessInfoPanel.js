export default function BusinessInfoPanel({ business, setBusiness, nextInvoiceNumber, setNextInvoiceNumber }) {
  return (
    <details>
      <summary>Your business info (for invoices)</summary>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '6px 0 12px' }}>
        Shows on every invoice PDF. Saved automatically in this browser.
      </p>
      <div className="field-row">
        <div>
          <label htmlFor="biz-name">Business / your name</label>
          <input id="biz-name" type="text" value={business.name} onChange={(e) => setBusiness((b) => ({ ...b, name: e.target.value }))} placeholder="Jordan Rivera Design" />
        </div>
        <div>
          <label htmlFor="biz-email">Email</label>
          <input id="biz-email" type="text" value={business.email} onChange={(e) => setBusiness((b) => ({ ...b, email: e.target.value }))} placeholder="hello@yourdomain.com" />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="biz-phone">Phone</label>
          <input id="biz-phone" type="text" value={business.phone} onChange={(e) => setBusiness((b) => ({ ...b, phone: e.target.value }))} placeholder="(555) 010-0199" />
        </div>
        <div>
          <label htmlFor="biz-address">Address (optional)</label>
          <input id="biz-address" type="text" value={business.address} onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))} placeholder="City, State" />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="biz-footer">Invoice footer note</label>
          <input id="biz-footer" type="text" value={business.footerNote} onChange={(e) => setBusiness((b) => ({ ...b, footerNote: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="next-invoice-number">Next invoice number</label>
          <input
            id="next-invoice-number" type="number" min="1" value={nextInvoiceNumber}
            onChange={(e) => setNextInvoiceNumber(Math.max(1, +e.target.value || 1))}
          />
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
        Invoice numbers don&apos;t reset automatically when you delete estimates \u2014 reused numbers cause real bookkeeping problems if an old invoice ever needs tracing. Change this manually only when you&apos;re sure it&apos;s safe to (e.g. before you&apos;ve sent any real invoices).
      </p>
    </details>
  );
}

import { fmt } from '../lib/rates';

export default function InvoicesPanel({ invoices, onDelete, folderConnected }) {
  return (
    <div className="panel">
      <h2>Invoices</h2>
      <div className="saved-list">
        {invoices.length === 0 ? (
          <p className="empty-note">No invoices generated yet. Use &quot;Download invoice&quot; on an estimate.</p>
        ) : (
          [...invoices].reverse().map((inv) => (
            <div className="saved-item" key={inv.id}>
              <div className="meta">
                <strong>INV-{String(inv.invoiceNumber).padStart(4, '0')} &middot; {inv.client || 'Untitled client'}</strong>
                <span>{inv.project || ''} &middot; {inv.invoiceDate} &middot; {fmt(inv.finalPrice)}</span>
              </div>
              <div className="actions">
                <button className="small ghost" type="button" onClick={() => onDelete(inv)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
      {invoices.length > 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
          {folderConnected
            ? 'Deleting here removes the invoice PDF too, if it was saved to your connected folder. The underlying estimate stays in your saved list.'
            : 'This removes the invoice status from the estimate \u2014 files already downloaded to your Downloads folder aren\u2019t affected. The estimate itself stays saved.'}
        </p>
      )}
    </div>
  );
}

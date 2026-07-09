import { fmt } from '../lib/rates';

export default function SavedEstimatesPanel({ savedList, onLoad, onDelete, activeEstimateId }) {
  return (
    <div className="panel">
      <h2>Saved estimates</h2>
      <div className="saved-list">
        {savedList.length === 0 ? (
          <p className="empty-note">No saved estimates yet. Build one and click &quot;Save estimate&quot;.</p>
        ) : (
          [...savedList].reverse().map((item) => (
            <div className="saved-item" key={item.id}>
              <div className="meta">
                <strong>
                  {item.client || 'Untitled client'}
                  {item.id === activeEstimateId && <span style={{ color: 'var(--gold)', fontWeight: 400 }}> &middot; editing</span>}
                </strong>
                <span>
                  {item.project || ''} &middot; {item.date} &middot; {fmt(item.low)}&ndash;{fmt(item.high)}
                  {item.invoiceNumber && <> &middot; invoiced (INV-{String(item.invoiceNumber).padStart(4, '0')})</>}
                </span>
              </div>
              <div className="actions">
                <button className="small" type="button" onClick={() => onLoad(item)}>Load</button>
                <button className="small ghost" type="button" onClick={() => onDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

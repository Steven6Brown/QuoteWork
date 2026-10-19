'use client';

import { useState } from 'react';
import { fmtRange } from '../lib/rates';
import { invoiceLabel } from '../lib/invoice';

// Estimates saved before invoice types existed have no invoiceType, so they
// count as project (deposit and balance) estimates.
const isManagement = (item) => item.invoiceType === 'full';

const TABS = [
  { key: 'all', label: 'All', match: () => true, empty: 'No saved estimates yet. Build one and click "Save estimate".' },
  { key: 'project', label: 'Deposit & balance', match: (i) => !isManagement(i), empty: 'No deposit and balance estimates saved yet.' },
  { key: 'management', label: 'Management', match: isManagement, empty: 'No management or pay-in-full estimates saved yet.' },
];

export default function SavedEstimatesPanel({ savedList, onLoad, onDelete, activeEstimateId }) {
  const [tab, setTab] = useState('all');
  const current = TABS.find((t) => t.key === tab) || TABS[0];
  const visible = [...savedList].reverse().filter(current.match);

  return (
    <div className="panel">
      <h2>Saved estimates</h2>

      <div role="tablist" aria-label="Saved estimate types" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {TABS.map((t) => {
          const count = savedList.filter(t.match).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`small${active ? ' primary' : ' ghost'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="saved-list" role="tabpanel">
        {visible.length === 0 ? (
          <p className="empty-note">{current.empty}</p>
        ) : (
          visible.map((item) => (
            <div className="saved-item" key={item.id}>
              <div className="meta">
                <strong>
                  {item.client || 'Untitled client'}
                  {item.id === activeEstimateId && <span style={{ color: 'var(--gold)', fontWeight: 400 }}> &middot; editing</span>}
                </strong>
                <span>
                  {item.project || ''} &middot; {item.date} &middot; {fmtRange(item.low, item.high)}
                  {tab === 'all' && <> &middot; {isManagement(item) ? 'pay in full' : 'deposit & balance'}</>}
                  {item.invoiceNumber && <> &middot; invoiced ({invoiceLabel(item.invoiceNumber, isManagement(item))})</>}
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

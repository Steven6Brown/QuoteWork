import { EXP_LABELS } from '../lib/rates';

export default function RateLevelPanel({ expIndex, setExpIndex }) {
  return (
    <div className="panel">
      <h2>Your rate level</h2>
      <label htmlFor="experience">
        Adjusts every line by a multiplier: <strong>{EXP_LABELS[expIndex]}</strong>
      </label>
      <input id="experience" type="range" min="0" max="3" step="1" value={expIndex} onChange={(e) => setExpIndex(+e.target.value)} style={{ width: '100%' }} />
    </div>
  );
}

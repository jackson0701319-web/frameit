import { FRAMES } from '../lib/constants';

export default function FramePicker({ selected, onChange }) {
  return (
    <div className="frame-picker">
      {FRAMES.map((frame) => (
        <button
          key={frame.id}
          type="button"
          className={`frame-picker__item ${selected === frame.id ? 'active' : ''}`}
          onClick={() => onChange(frame.id)}
          style={{
            '--frame-bg': frame.bg,
            '--frame-border': frame.border,
            '--frame-text': frame.text,
          }}
        >
          <span className="frame-picker__swatch" />
          {frame.name}
        </button>
      ))}
    </div>
  );
}

import { LAYOUT_LIST } from '../lib/constants';

function LayoutThumb({ layoutId }) {
  if (layoutId === 'wide-6') {
    return (
      <span className="layout-picker__thumb layout-picker__thumb--wide-6" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="layout-picker__cell" />
        ))}
      </span>
    );
  }

  return <span className={`layout-picker__thumb layout-picker__thumb--${layoutId}`} aria-hidden="true" />;
}

export default function LayoutPicker({ selected, onChange }) {
  return (
    <div className="layout-picker">
      {LAYOUT_LIST.map((layout) => (
        <button
          key={layout.id}
          type="button"
          className={`layout-picker__item ${selected === layout.id ? 'active' : ''}`}
          onClick={() => onChange(layout.id)}
        >
          <LayoutThumb layoutId={layout.id} />
          <span className="layout-picker__text">
            <strong>{layout.name}</strong>
            <small>{layout.subtitle} · 컷 {layout.photoLabel}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

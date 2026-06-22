import {
  STRIP_DECORS,
  STRIP_DECOR_OPACITY_MIN,
  STRIP_DECOR_OPACITY_MAX,
  getStripDecor,
} from '../lib/constants';
import { clampStripDecorOpacity } from '../lib/stripDecor';

export default function StripDecorPicker({
  selected,
  opacity,
  onChange,
  onOpacityChange,
}) {
  const setOpacity = (raw) => onOpacityChange(clampStripDecorOpacity(raw));
  const showOpacity = getStripDecor(selected).id !== 'none';

  return (
    <div className="strip-decor-picker">
      {STRIP_DECORS.map((decor) => (
        <button
          key={decor.id}
          type="button"
          className={`strip-decor-picker__item ${selected === decor.id ? 'active' : ''}`}
          onClick={() => onChange(decor.id)}
        >
          <span className="strip-decor-picker__label">{decor.name}</span>
          <span className="strip-decor-picker__preview">{decor.preview}</span>
        </button>
      ))}

      {showOpacity && (
        <div className="strip-decor-picker__opacity">
          <label className="strip-decor-picker__opacity-label" htmlFor="strip-decor-opacity">
            선명도
          </label>
          <div className="strip-decor-picker__opacity-row">
            <input
              id="strip-decor-opacity"
              type="range"
              className="strip-decor-picker__range"
              min={STRIP_DECOR_OPACITY_MIN}
              max={STRIP_DECOR_OPACITY_MAX}
              step={1}
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
            />
            <span className="strip-decor-picker__opacity-value">{opacity}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

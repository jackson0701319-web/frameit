import {
  PHOTO_SCALE_MIN,
  PHOTO_SCALE_MAX,
} from '../lib/constants';
import { clampPhotoScale } from '../lib/layout';

export default function PhotoScaleControl({ value, onChange }) {
  const setScale = (raw) => onChange(clampPhotoScale(raw));

  return (
    <div className="photo-scale">
      <label className="photo-scale__label" htmlFor="photo-scale-input">
        사진 크기
      </label>
      <div className="photo-scale__row">
        <input
          id="photo-scale-range"
          type="range"
          className="photo-scale__range"
          min={PHOTO_SCALE_MIN}
          max={PHOTO_SCALE_MAX}
          step={1}
          value={value}
          onChange={(e) => setScale(e.target.value)}
        />
        <div className="photo-scale__input-wrap">
          <input
            id="photo-scale-input"
            type="number"
            className="photo-scale__input"
            min={PHOTO_SCALE_MIN}
            max={PHOTO_SCALE_MAX}
            step={1}
            value={value}
            onChange={(e) => setScale(e.target.value)}
          />
          <span className="photo-scale__unit">%</span>
        </div>
      </div>
      <p className="photo-scale__hint">100%가 기본 · 낮출수록 프레임 여백이 넓어져요</p>
    </div>
  );
}

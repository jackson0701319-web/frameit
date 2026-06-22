import {
  CAPTION_SCALE_MIN,
  CAPTION_SCALE_MAX,
} from '../lib/constants';
import { clampTextScale } from '../lib/textOverlays';

export default function TextControls({
  overlays,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const selected = overlays.find((o) => o.id === selectedId) ?? null;
  const setScale = (raw) => {
    if (!selected) return;
    onUpdate(selected.id, { scale: clampTextScale(raw) });
  };

  return (
    <div className="text-controls">
      <button type="button" className="text-controls__add" onClick={onAdd}>
        + 텍스트 추가
      </button>

      {overlays.length > 0 && (
        <div className="text-controls__list">
          {overlays.map((overlay, index) => (
            <button
              key={overlay.id}
              type="button"
              className={`text-controls__tab ${selectedId === overlay.id ? 'active' : ''}`}
              onClick={() => onSelect(overlay.id)}
            >
              {overlay.text.trim() || `텍스트 ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <input
            type="text"
            className="text-controls__input"
            placeholder="문구 입력 (예: with friends ♡)"
            value={selected.text}
            maxLength={40}
            onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
          />
          <div className="text-controls__scale">
            <label className="text-controls__scale-label" htmlFor="text-scale-input">
              글자 크기
            </label>
            <div className="text-controls__scale-row">
              <input
                type="range"
                className="text-controls__range"
                min={CAPTION_SCALE_MIN}
                max={CAPTION_SCALE_MAX}
                step={1}
                value={selected.scale}
                onChange={(e) => setScale(e.target.value)}
              />
              <div className="text-controls__input-wrap">
                <input
                  id="text-scale-input"
                  type="number"
                  className="text-controls__scale-input"
                  min={CAPTION_SCALE_MIN}
                  max={CAPTION_SCALE_MAX}
                  step={1}
                  value={selected.scale}
                  onChange={(e) => setScale(e.target.value)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-controls__remove"
            onClick={() => onRemove(selected.id)}
          >
            이 텍스트 삭제
          </button>
        </>
      )}

      <p className="text-controls__hint">
        {overlays.length > 0
          ? '프레임에서 텍스트를 눌러 선택하고, 드래그해 위치를 옮기세요'
          : '텍스트를 추가한 뒤 프레임 위에서 자유롭게 배치할 수 있어요'}
      </p>
    </div>
  );
}

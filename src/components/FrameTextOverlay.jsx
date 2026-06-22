import { useRef, useCallback } from 'react';
import { setTextOverlayPosition, getTextPreviewFontSize } from '../lib/textOverlays';

export default function FrameTextOverlay({
  overlay,
  selected,
  color,
  onSelect,
  onMove,
}) {
  const dragRef = useRef(null);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const moveToPointer = (id, clientX, clientY, frameRect) => {
    const x = ((clientX - frameRect.left) / frameRect.width) * 100;
    const y = ((clientY - frameRect.top) / frameRect.height) * 100;
    onMove(id, setTextOverlayPosition(overlay, x, y));
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(overlay.id);

    const frameEl = e.currentTarget.closest('.interactive-frame');
    if (!frameEl) return;

    const rect = frameEl.getBoundingClientRect();
    dragRef.current = { id: overlay.id, frameRect: rect };

    moveToPointer(overlay.id, e.clientX, e.clientY, rect);

    const onMoveEvent = (ev) => {
      const session = dragRef.current;
      if (!session) return;
      moveToPointer(session.id, ev.clientX, ev.clientY, session.frameRect);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMoveEvent);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      endDrag();
    };

    window.addEventListener('pointermove', onMoveEvent);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  if (!overlay.text.trim()) return null;

  return (
    <div
      className={`frame-text ${selected ? 'frame-text--selected' : ''}`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        color,
        fontSize: getTextPreviewFontSize(overlay.scale),
      }}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label={`텍스트: ${overlay.text}`}
    >
      <span className="frame-text__label">{overlay.text}</span>
    </div>
  );
}

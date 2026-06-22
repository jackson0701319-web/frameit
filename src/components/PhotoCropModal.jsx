import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PHOTO_ZOOM_MIN,
  PHOTO_ZOOM_MAX,
  DEFAULT_PHOTO_FOCUS,
  clampZoom,
  focusFromDrag,
  focusWithZoom,
  getCoverImageStyle,
  normalizeFocus,
} from '../lib/photoCover';

export default function PhotoCropModal({
  open,
  photoIndex,
  src,
  slotAspect,
  filterStyle,
  initialFocus,
  onConfirm,
  onClose,
}) {
  const viewportRef = useRef(null);
  const imgMeta = useRef(null);
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const panStart = useRef(null);

  const [draft, setDraft] = useState(DEFAULT_PHOTO_FOCUS);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(normalizeFocus(initialFocus));
    setImgReady(false);
    imgMeta.current = null;
    pointers.current.clear();
    pinchStart.current = null;
    panStart.current = null;
  }, [open, initialFocus, photoIndex, src]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const updateDraft = useCallback((next) => {
    setDraft(normalizeFocus(next));
  }, []);

  const handleImgLoad = (e) => {
    imgMeta.current = {
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight,
    };
    setImgReady(true);
  };

  const applyZoomDelta = useCallback((delta) => {
    setDraft((prev) => focusWithZoom(prev, clampZoom(prev.zoom + delta)));
  }, []);

  const handlePointerDown = (e) => {
    if (!imgReady) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        focus: draft,
      };
    }

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, zoom: draft.zoom };
      panStart.current = null;
    }
  };

  const handlePointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / pinchStart.current.dist;
      setDraft((prev) => focusWithZoom(
        prev,
        clampZoom(Math.round(pinchStart.current.zoom * ratio)),
      ));
      return;
    }

    if (pointers.current.size === 1 && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const meta = imgMeta.current;
      const viewport = viewportRef.current;
      if (!meta || !viewport) return;

      const rect = viewport.getBoundingClientRect();
      const next = focusFromDrag(
        panStart.current.focus,
        dx,
        dy,
        rect.width,
        rect.height,
        meta.w,
        meta.h,
      );
      updateDraft(next);
    }
  };

  const handlePointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
  };

  if (!open || !src) return null;

  const meta = imgMeta.current;
  const imageStyle = imgReady && meta
    ? {
        ...getCoverImageStyle(draft, meta.w, meta.h, slotAspect),
        filter: filterStyle || undefined,
      }
    : { filter: filterStyle || undefined };

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
      <button type="button" className="crop-modal__backdrop" aria-label="닫기" onClick={onClose} />

      <div className="crop-modal__sheet">
        <header className="crop-modal__header">
          <h3 id="crop-modal-title">{photoIndex + 1}번 사진 위치</h3>
          <button type="button" className="crop-modal__close" onClick={onClose}>
            취소
          </button>
        </header>

        <div
          ref={viewportRef}
          className="crop-modal__viewport"
          style={{ aspectRatio: slotAspect }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={src}
            alt={`${photoIndex + 1}번 사진 크롭`}
            style={imageStyle}
            draggable={false}
            onLoad={handleImgLoad}
          />
          <div className="crop-modal__frame-guide" aria-hidden="true" />
        </div>

        <div className="crop-modal__zoom">
          <button
            type="button"
            className="crop-modal__zoom-btn"
            onClick={() => applyZoomDelta(-10)}
            disabled={draft.zoom <= PHOTO_ZOOM_MIN}
            aria-label="줌 아웃"
          >
            −
          </button>
          <input
            type="range"
            className="crop-modal__zoom-range"
            min={PHOTO_ZOOM_MIN}
            max={PHOTO_ZOOM_MAX}
            step={1}
            value={draft.zoom}
            onChange={(e) => setDraft((prev) => focusWithZoom(prev, Number(e.target.value)))}
            aria-label="줌"
          />
          <button
            type="button"
            className="crop-modal__zoom-btn"
            onClick={() => applyZoomDelta(10)}
            disabled={draft.zoom >= PHOTO_ZOOM_MAX}
            aria-label="줌 인"
          >
            +
          </button>
        </div>

        <p className="crop-modal__zoom-label">확대 {draft.zoom}%</p>
        <p className="crop-modal__hint">드래그로 위치 · 핀치 또는 슬라이더로 확대/축소</p>

        <button
          type="button"
          className="crop-modal__done"
          onClick={() => onConfirm(normalizeFocus(draft))}
        >
          완료
        </button>
      </div>
    </div>
  );
}

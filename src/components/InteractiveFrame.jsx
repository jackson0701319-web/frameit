import { useRef, useState } from 'react';
import { FRAMES, getLayout, getCanvasSize, BRAND_NAME } from '../lib/constants';
import {
  getDisplaySlots,
  getStripDividerPercent,
  getBrandMarks,
} from '../lib/layout';
import { getFilterStyle } from '../lib/filters';
import {
  DEFAULT_PHOTO_FOCUS,
  getCoverImageStyle,
  normalizeFocus,
} from '../lib/photoCover';
import PhotoCropModal from './PhotoCropModal';
import FrameTextOverlay from './FrameTextOverlay';
import StripDecorOverlay from './StripDecorOverlay';

export default function InteractiveFrame({
  layoutId,
  frameId,
  filterId,
  stripDecorId = 'none',
  stripDecorOpacity = 85,
  photos,
  photoFocus = [],
  textOverlays = [],
  selectedTextId,
  onTextSelect,
  onTextMove,
  photoScale = 100,
  onPhotosChange,
  onPhotoFocusChange,
  onReorder,
}) {
  const inputRef = useRef(null);
  const targetSlot = useRef(null);
  const dragFrom = useRef(null);
  const imgMeta = useRef({});
  const [cropTarget, setCropTarget] = useState(null);
  const [, setImgVersion] = useState(0);

  const layout = getLayout(layoutId);
  const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0];
  const { width, height } = getCanvasSize(layoutId);
  const slots = getDisplaySlots(layoutId, photoScale, stripDecorId);
  const stripDivider = getStripDividerPercent(layoutId, photoScale, stripDecorId);
  const brandMarks = getBrandMarks(layoutId);
  const filterStyle = getFilterStyle(filterId);
  const isDual = layout.type === 'dual-column';

  const getFocus = (index) => photoFocus[index] ?? DEFAULT_PHOTO_FOCUS;

  const openPicker = (photoIndex) => {
    targetSlot.current = photoIndex;
    inputRef.current?.click();
  };

  const openCrop = (photoIndex, slotAspect) => {
    setCropTarget({ photoIndex, slotAspect });
  };

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const i = targetSlot.current;
    if (i === null || i === undefined) return;
    const next = [...photos];
    if (next[i]?.startsWith('blob:')) URL.revokeObjectURL(next[i]);
    next[i] = URL.createObjectURL(file);
    onPhotosChange(next);
    onPhotoFocusChange?.(i, { ...DEFAULT_PHOTO_FOCUS });
    delete imgMeta.current[i];
  };

  const removePhoto = (photoIndex, e) => {
    e.stopPropagation();
    const next = [...photos];
    if (next[photoIndex]?.startsWith('blob:')) URL.revokeObjectURL(next[photoIndex]);
    next[photoIndex] = null;
    onPhotosChange(next);
    onPhotoFocusChange?.(photoIndex, { ...DEFAULT_PHOTO_FOCUS });
    delete imgMeta.current[photoIndex];
  };

  const handleReorder = (from, to) => {
    if (from === null || from === to) return;
    onReorder?.(from, to);
  };

  const handleFileDrop = (e, photoIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      targetSlot.current = photoIndex;
      handleFile(file);
    } else if (dragFrom.current !== null) {
      handleReorder(dragFrom.current, photoIndex);
      dragFrom.current = null;
    }
  };

  const handleImgLoad = (photoIndex, e) => {
    imgMeta.current[photoIndex] = {
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight,
    };
    setImgVersion((v) => v + 1);
  };

  const filledCount = photos.filter(Boolean).length;

  return (
    <div className="interactive-frame-wrap">
      <p className="interactive-frame__hint">
        {isDual
          ? `칸을 눌러 사진 4장 넣기 (좌·우 동일 복사) · ${filledCount}/${layout.photoCount}`
          : `칸을 눌러 사진을 넣으세요 · ${filledCount}/${layout.photoCount}`}
        {filledCount > 0 && ' · ✂ 버튼으로 위치·확대를 조절할 수 있어요'}
      </p>

      <div
        className="interactive-frame"
        data-frame={frame.id}
        style={{
          aspectRatio: `${width} / ${height}`,
          background: frame.bg,
          borderColor: frame.border,
          '--slot-empty-bg': frame.id === 'black' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          '--slot-empty-border': frame.id === 'black' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
          '--slot-placeholder': frame.id === 'black' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
        }}
      >
        {slots.map((rect, i) => {
          const pi = rect.photoIndex;
          const src = photos[pi];
          const isMirror = rect.mirror;
          const focus = getFocus(pi);
          const meta = imgMeta.current[pi];

          return (
            <div
              key={`${rect.column ?? 's'}-${i}`}
              className={`frame-slot ${src ? 'frame-slot--filled' : 'frame-slot--empty'} ${isMirror ? 'frame-slot--mirror' : ''}`}
              style={rect}
              onClick={() => { if (!src) openPicker(pi); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleFileDrop(e, pi)}
            >
              {src ? (
                <>
                  <div className="frame-slot__image-layer">
                    <img
                      src={src}
                      alt={`${pi + 1}번 컷${isMirror ? ' (복사)' : ''}`}
                      style={{
                        filter: filterStyle || undefined,
                        ...(meta ? getCoverImageStyle(focus, meta.w, meta.h, rect.slotAspect) : {}),
                      }}
                      draggable={false}
                      onLoad={(e) => handleImgLoad(pi, e)}
                    />
                  </div>
                  {!isMirror && (
                    <div className="frame-slot__actions">
                      <button
                        type="button"
                        className="frame-slot__btn frame-slot__btn--crop"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCrop(pi, rect.slotAspect);
                        }}
                        title="위치·확대 조절"
                        aria-label="위치·확대 조절"
                      >
                        ✂
                      </button>
                      <button
                        type="button"
                        className="frame-slot__btn frame-slot__btn--grip"
                        draggable
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                          dragFrom.current = pi;
                          e.stopPropagation();
                        }}
                        onDragEnd={() => { dragFrom.current = null; }}
                        title="순서 바꾸기 (드래그)"
                        aria-label="순서 바꾸기"
                      >
                        ⋮⋮
                      </button>
                      <button
                        type="button"
                        className="frame-slot__btn"
                        onClick={(e) => { e.stopPropagation(); openPicker(pi); }}
                        title="변경"
                      >
                        ↻
                      </button>
                      <button
                        type="button"
                        className="frame-slot__btn frame-slot__btn--remove"
                        onClick={(e) => removePhoto(pi, e)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="frame-slot__placeholder">
                  <span className="frame-slot__plus">+</span>
                  <span className="frame-slot__num">{pi + 1}</span>
                </div>
              )}
            </div>
          );
        })}

        {stripDivider && (
          <div
            className="frame-strip-divider"
            style={stripDivider}
          />
        )}

        <StripDecorOverlay
          layoutId={layoutId}
          frameId={frameId}
          stripDecorId={stripDecorId}
          stripDecorOpacity={stripDecorOpacity}
        />

        {textOverlays.map((overlay) => (
          <FrameTextOverlay
            key={overlay.id}
            overlay={overlay}
            selected={selectedTextId === overlay.id}
            color={frame.text}
            onSelect={onTextSelect}
            onMove={onTextMove}
          />
        ))}

        {brandMarks.map((brandMark, index) => (
          <span
            key={`brand-mark-${index}`}
            className="frame-brand-mark"
            aria-hidden="true"
            style={{
              left: `${brandMark.leftPercent}%`,
              top: `${brandMark.topPercent}%`,
              fontSize: `${brandMark.fontSizeCqh}cqh`,
            }}
          >
            {BRAND_NAME}
          </span>
        ))}
      </div>

      <PhotoCropModal
        open={cropTarget !== null}
        photoIndex={cropTarget?.photoIndex ?? 0}
        src={cropTarget ? photos[cropTarget.photoIndex] : null}
        slotAspect={cropTarget?.slotAspect ?? 1}
        filterStyle={filterStyle}
        initialFocus={cropTarget ? getFocus(cropTarget.photoIndex) : DEFAULT_PHOTO_FOCUS}
        onConfirm={(focus) => {
          if (cropTarget) onPhotoFocusChange?.(cropTarget.photoIndex, normalizeFocus(focus));
          setCropTarget(null);
        }}
        onClose={() => setCropTarget(null)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

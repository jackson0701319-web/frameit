import {
  CAPTION_SCALE_DEFAULT,
  CAPTION_SCALE_MAX,
  CAPTION_SCALE_MIN,
  TEXT_HEIGHT_RATIO,
} from './constants';

let overlaySeq = 0;

export function createTextOverlay(text = '텍스트') {
  overlaySeq += 1;
  return {
    id: `text-${Date.now()}-${overlaySeq}`,
    text,
    x: 50,
    y: 88,
    scale: CAPTION_SCALE_DEFAULT,
  };
}

export function clampTextScale(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return CAPTION_SCALE_DEFAULT;
  return Math.min(CAPTION_SCALE_MAX, Math.max(CAPTION_SCALE_MIN, Math.round(n)));
}

export function clampTextPosition(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export function normalizeTextOverlay(overlay) {
  if (!overlay) return null;
  return {
    id: overlay.id,
    text: overlay.text ?? '',
    x: clampTextPosition(overlay.x),
    y: clampTextPosition(overlay.y),
    scale: clampTextScale(overlay.scale),
  };
}

export function getTextFontSize(canvasH, scale = CAPTION_SCALE_DEFAULT) {
  return Math.max(9, canvasH * TEXT_HEIGHT_RATIO * (scale / CAPTION_SCALE_DEFAULT));
}

/** 미리보기용 cqh (캔버스 합성과 동일 비율) */
export function getTextPreviewFontSize(scale = CAPTION_SCALE_DEFAULT) {
  const baseCqh = TEXT_HEIGHT_RATIO * 100;
  return `calc(${baseCqh}cqh * ${scale / CAPTION_SCALE_DEFAULT})`;
}

export function drawTextOverlays(ctx, overlays, canvasW, canvasH, frame) {
  const items = overlays
    .map(normalizeTextOverlay)
    .filter((o) => o && o.text.trim());

  items.forEach((overlay) => {
    const x = (canvasW * overlay.x) / 100;
    const y = (canvasH * overlay.y) / 100;
    const fontSize = getTextFontSize(canvasH, overlay.scale);
    const text = overlay.text.trim();

    ctx.save();
    ctx.font = `500 ${fontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = frame.id === 'black' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = Math.max(2, canvasH * 0.003);
    ctx.fillStyle = frame.text;
    ctx.fillText(text, x, y);
    ctx.restore();
  });
}

export function moveTextOverlay(overlay, dxPercent, dyPercent) {
  const base = normalizeTextOverlay(overlay);
  return {
    ...base,
    x: clampTextPosition(base.x + dxPercent),
    y: clampTextPosition(base.y + dyPercent),
  };
}

/** 포인터 위치(%)로 텍스트 앵커 이동 */
export function setTextOverlayPosition(overlay, x, y) {
  const base = normalizeTextOverlay(overlay);
  return {
    ...base,
    x: clampTextPosition(x),
    y: clampTextPosition(y),
  };
}

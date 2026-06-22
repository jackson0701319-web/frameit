import {
  PHOTO_ZOOM_MIN,
  PHOTO_ZOOM_MAX,
  PHOTO_ZOOM_DEFAULT,
} from './constants';

export { PHOTO_ZOOM_MIN, PHOTO_ZOOM_MAX, PHOTO_ZOOM_DEFAULT };

export const DEFAULT_PHOTO_FOCUS = { x: 50, y: 50, zoom: PHOTO_ZOOM_DEFAULT };

export function clampFocus(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export function clampZoom(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return PHOTO_ZOOM_DEFAULT;
  return Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, Math.round(n)));
}

export function normalizeFocus(focus) {
  if (!focus) return { ...DEFAULT_PHOTO_FOCUS };
  return {
    x: clampFocus(focus.x),
    y: clampFocus(focus.y),
    zoom: clampZoom(focus.zoom ?? PHOTO_ZOOM_DEFAULT),
  };
}

/** cover 크롭 시 소스 영역 계산 (zoom 100 = 기본 cover) */
export function computeCoverSourceRect(imgW, imgH, destW, destH, focus) {
  const { x: fx, y: fy, zoom } = normalizeFocus(focus);
  const coverScale = Math.max(destW / imgW, destH / imgH);
  const scale = coverScale * (zoom / 100);
  const sw = destW / scale;
  const sh = destH / scale;
  const maxSx = Math.max(0, imgW - sw);
  const maxSy = Math.max(0, imgH - sh);
  const sx = maxSx * (fx / 100);
  const sy = maxSy * (fy / 100);
  return { sx, sy, sw, sh };
}

/** 슬롯 비율만 알 때 소스 영역 계산 */
export function computeCoverSourceRectFromAspect(imgW, imgH, slotAspect, focus) {
  const slotH = 1;
  const slotW = slotAspect;
  return computeCoverSourceRect(imgW, imgH, slotW, slotH, focus);
}

/** 미리보기용 img 절대 배치 (퍼센트 기준, 부모는 relative + overflow hidden) */
export function getCoverImageStyle(focus, imgW, imgH, slotAspect) {
  if (!imgW || !imgH || !slotAspect) return {};
  const { sx, sy, sw, sh } = computeCoverSourceRectFromAspect(imgW, imgH, slotAspect, focus);
  return {
    position: 'absolute',
    width: `${(imgW / sw) * 100}%`,
    height: `${(imgH / sh) * 100}%`,
    left: `${(-sx / sw) * 100}%`,
    top: `${(-sy / sh) * 100}%`,
    maxWidth: 'none',
    objectFit: 'fill',
  };
}

/** 드래그로 포커스 이동 */
export function focusFromDrag(focus, dx, dy, slotW, slotH, imgW, imgH) {
  const f = normalizeFocus(focus);
  const coverScale = Math.max(slotW / imgW, slotH / imgH);
  const scale = coverScale * (f.zoom / 100);
  const sw = slotW / scale;
  const sh = slotH / scale;
  const maxSx = Math.max(0, imgW - sw);
  const maxSy = Math.max(0, imgH - sh);

  let sx = maxSx * (f.x / 100);
  let sy = maxSy * (f.y / 100);

  sx = Math.max(0, Math.min(maxSx, sx - dx / scale));
  sy = Math.max(0, Math.min(maxSy, sy - dy / scale));

  return {
    ...f,
    x: maxSx > 0 ? (sx / maxSx) * 100 : 50,
    y: maxSy > 0 ? (sy / maxSy) * 100 : 50,
  };
}

export function focusWithZoom(focus, zoom) {
  return normalizeFocus({ ...normalizeFocus(focus), zoom });
}

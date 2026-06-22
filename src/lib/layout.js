import { getLayout, getCanvasSize, PHOTO_SCALE_MIN, PHOTO_SCALE_MAX, PHOTOISM_RATIOS, getStripDecor } from './constants';

function stripPaddingPx(halfW, useDecorPadding) {
  const ratio = useDecorPadding ? PHOTOISM_RATIOS.paddingXDecor : PHOTOISM_RATIOS.paddingX;
  return Math.round(halfW * ratio);
}

function resolvePaddingX(layout, canvasW, stripDecorId) {
  const r = PHOTOISM_RATIOS;
  const hasDecor = getStripDecor(stripDecorId).id !== 'none';

  if (layout.type === 'grid-2x3') {
    const ratio = hasDecor ? r.cardPaddingDecor : r.cardPadding;
    return Math.round(canvasW * ratio);
  }

  if (layout.type === 'dual-column') {
    const stripGap = Math.max(4, Math.round(canvasW * r.stripCenterGap));
    const halfW = (canvasW - stripGap) / 2;
    return stripPaddingPx(halfW, hasDecor);
  }

  const ratio = hasDecor ? r.paddingXDecor : r.paddingX;
  return Math.round(canvasW * ratio);
}

/** 포토이즘 실측 비율 → 픽셀 (레이아웃·해상도에 맞게 스케일) */
export function getLayoutMetrics(layout, canvasW, canvasH, stripDecorId = 'none') {
  const r = PHOTOISM_RATIOS;
  const photoGap = Math.max(4, Math.round(canvasH * r.photoGap));
  const paddingX = resolvePaddingX(layout, canvasW, stripDecorId);

  if (layout.type === 'grid-2x3') {
    const pad = paddingX;
    return {
      paddingX: pad,
      paddingTop: pad,
      paddingBottom: pad,
      gap: photoGap,
      gapX: photoGap,
      gapY: photoGap,
      stripGap: 0,
    };
  }

  if (layout.type === 'dual-column') {
    return {
      paddingX,
      paddingTop: Math.round(canvasH * r.paddingTop),
      paddingBottom: Math.round(canvasH * r.paddingBottom),
      gap: photoGap,
      gapX: photoGap,
      gapY: photoGap,
      stripGap: Math.max(4, Math.round(canvasW * r.stripCenterGap)),
    };
  }

  return {
    paddingX,
    paddingTop: Math.round(canvasH * r.paddingTop),
    paddingBottom: Math.round(canvasH * r.paddingBottom),
    gap: photoGap,
    gapX: photoGap,
    gapY: photoGap,
    stripGap: 0,
  };
}
export function clampPhotoScale(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return PHOTO_SCALE_MAX;
  return Math.min(PHOTO_SCALE_MAX, Math.max(PHOTO_SCALE_MIN, Math.round(n)));
}

export function computePhotoSlots(layoutId, canvasW, canvasH, photoScale = PHOTO_SCALE_MAX, stripDecorId = 'none') {
  const layout = getLayout(layoutId);

  if (layout.type === 'dual-column') {
    return computeDualColumnSlots(layout, canvasW, canvasH, photoScale, stripDecorId);
  }

  const rect = scaledContentRect(layout, canvasW, canvasH, photoScale, stripDecorId);

  switch (layout.type) {
    case 'grid-2x3':
      return computeGridSlots(layout, rect, canvasW, canvasH, stripDecorId);
    default:
      return computeSingleColumnSlots(layout, rect, canvasW, canvasH, stripDecorId);
  }
}

function contentRect(layout, canvasW, canvasH, stripDecorId = 'none') {
  const m = getLayoutMetrics(layout, canvasW, canvasH, stripDecorId);
  return {
    x: m.paddingX,
    y: m.paddingTop,
    w: canvasW - m.paddingX * 2,
    h: canvasH - m.paddingTop - m.paddingBottom,
  };
}
function getDecorPhotoCompensation(layout, canvasW, canvasH, stripDecorId) {
  if (getStripDecor(stripDecorId).id === 'none') return 1;

  const noneRect = contentRect(layout, canvasW, canvasH, 'none');
  const decorRect = contentRect(layout, canvasW, canvasH, stripDecorId);

  if (layout.type === 'dual-column') {
    return 1;
  }

  if (layout.type === 'grid-2x3') {
    const metrics = getLayoutMetrics(layout, canvasW, canvasH, stripDecorId);
    const cols = 2;
    const rows = 3;
    const noneCellW = (noneRect.w - (cols - 1) * metrics.gapX) / cols;
    const noneCellH = (noneRect.h - (rows - 1) * metrics.gapY) / rows;
    const decorCellW = (decorRect.w - (cols - 1) * metrics.gapX) / cols;
    const decorCellH = (decorRect.h - (rows - 1) * metrics.gapY) / rows;
    return Math.min(noneCellW / decorCellW, noneCellH / decorCellH);
  }

  return noneRect.w / decorRect.w;
}

function effectivePhotoScaleFactor(photoScale, layout, canvasW, canvasH, stripDecorId) {
  const userScale = clampPhotoScale(photoScale) / 100;
  const compensation = getDecorPhotoCompensation(layout, canvasW, canvasH, stripDecorId);
  return userScale * compensation;
}

function scaledContentRect(layout, canvasW, canvasH, photoScale, stripDecorId = 'none') {
  const rect = contentRect(layout, canvasW, canvasH, stripDecorId);
  const scale = effectivePhotoScaleFactor(photoScale, layout, canvasW, canvasH, stripDecorId);
  return scaleRectInCenter(rect, scale);
}

/** 영역 안에서 가운데 기준 확대·축소 */
function scaleRectInCenter(rect, scale) {
  if (scale === 1) return rect;
  return {
    x: rect.x + rect.w * (1 - scale) / 2,
    y: rect.y + rect.h * (1 - scale) / 2,
    w: rect.w * scale,
    h: rect.h * scale,
  };
}

function fitColumnPhotos(rect, count, photoAspect, gap) {
  let photoW = rect.w;
  let photoH = photoW / photoAspect;
  const totalH = count * photoH + (count - 1) * gap;

  if (totalH > rect.h) {
    photoH = (rect.h - (count - 1) * gap) / count;
    photoW = photoH * photoAspect;
  }

  const offsetX = rect.x + (rect.w - photoW) / 2;
  let y = rect.y + (rect.h - (count * photoH + (count - 1) * gap)) / 2;
  const slots = [];

  for (let i = 0; i < count; i++) {
    slots.push({ x: offsetX, y, w: photoW, h: photoH, photoIndex: i });
    y += photoH + gap;
  }
  return slots;
}

function computeSingleColumnSlots(layout, rect, canvasW, canvasH, stripDecorId) {
  const gap = getLayoutMetrics(layout, canvasW, canvasH, stripDecorId).gap;
  return fitColumnPhotos(rect, layout.photoCount, layout.photoAspect, gap);
}

function resolveDualColumnPadding(halfW, stripDecorId, side) {
  const hasDecor = getStripDecor(stripDecorId).id !== 'none';
  const normal = stripPaddingPx(halfW, false);
  const decor = stripPaddingPx(halfW, true);

  if (side === 'left') {
    return { paddingLeft: hasDecor ? decor : normal, paddingRight: normal };
  }
  return { paddingLeft: normal, paddingRight: hasDecor ? decor : normal };
}

function getHalfStripDecorCompensation(halfW, stripDecorId, side) {
  if (getStripDecor(stripDecorId).id === 'none') return 1;
  const pads = resolveDualColumnPadding(halfW, stripDecorId, side);
  const normal = stripPaddingPx(halfW, false);
  const noneW = halfW - normal * 2;
  const decorW = halfW - pads.paddingLeft - pads.paddingRight;
  return noneW / decorW;
}

function clampSlotsToColumn(slots, minX, maxX) {
  return slots.map((slot) => {
    const slotRight = slot.x + slot.w;
    const x = Math.max(slot.x, minX);
    const right = Math.min(slotRight, maxX);
    return { ...slot, x, w: Math.max(0, right - x) };
  });
}

function computeHalfStripSlots({
  columnX,
  halfW,
  canvasH,
  metrics,
  photoScale,
  stripDecorId,
  side,
  layout,
  gap,
}) {
  const pads = resolveDualColumnPadding(halfW, stripDecorId, side);
  const top = metrics.paddingTop;
  const columnH = canvasH - metrics.paddingTop - metrics.paddingBottom;
  const contentW = halfW - pads.paddingLeft - pads.paddingRight;
  const contentX = columnX + pads.paddingLeft;
  const userScale = clampPhotoScale(photoScale) / 100;
  const compensation = getHalfStripDecorCompensation(halfW, stripDecorId, side);
  const scaled = scaleRectInCenter(
    { x: contentX, y: top, w: contentW, h: columnH },
    userScale * compensation,
  );

  const slots = fitColumnPhotos(scaled, layout.photoCount, layout.photoAspect, gap);
  return clampSlotsToColumn(slots, columnX, columnX + halfW);
}

/**
 * 더블 스트립 = 스트립 4컷 2장을 좌·우에 나란히 배치.
 * 각 칸은 독립된 2×6 스트립과 동일하게 계산하고, 테두리 문구는 바깥쪽만 적용.
 */
function computeDualColumnSlots(layout, canvasW, canvasH, photoScale, stripDecorId = 'none') {
  const userScale = clampPhotoScale(photoScale) / 100;
  const metrics = getLayoutMetrics(layout, canvasW, canvasH, stripDecorId);
  const stripGap = metrics.stripGap;
  const halfW = (canvasW - stripGap) / 2;
  const gap = metrics.gap * userScale;

  const leftSlots = computeHalfStripSlots({
    columnX: 0,
    halfW,
    canvasH,
    metrics,
    photoScale,
    stripDecorId,
    side: 'left',
    layout,
    gap,
  });
  const rightSlots = computeHalfStripSlots({
    columnX: halfW + stripGap,
    halfW,
    canvasH,
    metrics,
    photoScale,
    stripDecorId,
    side: 'right',
    layout,
    gap,
  });

  return [
    ...leftSlots.map((s, i) => ({ ...s, photoIndex: i, column: 'left' })),
    ...rightSlots.map((s, i) => ({ ...s, photoIndex: i, column: 'right', mirror: true })),
  ];
}

function computeGridSlots(layout, rect, canvasW, canvasH, stripDecorId = 'none') {
  const cols = 2;
  const rows = layout.photoCount / cols;
  const { gapX, gapY } = getLayoutMetrics(layout, canvasW, canvasH, stripDecorId);
  // 콘텐츠 영역을 가로·세로 모두 꽉 채움 (가운데 정렬 여백 없음)
  const photoW = (rect.w - (cols - 1) * gapX) / cols;
  const photoH = (rect.h - (rows - 1) * gapY) / rows;
  const offsetX = rect.x;
  const offsetY = rect.y;
  const slots = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: offsetX + c * (photoW + gapX),
        y: offsetY + r * (photoH + gapY),
        w: photoW,
        h: photoH,
        photoIndex: idx++,
      });
    }
  }
  return slots;
}

export function getDisplaySlots(layoutId, photoScale = PHOTO_SCALE_MAX, stripDecorId = 'none') {
  const { width, height } = getCanvasSize(layoutId);
  const slots = computePhotoSlots(layoutId, width, height, photoScale, stripDecorId);
  return slots.map((s) => ({
    left: `${(s.x / width) * 100}%`,
    top: `${(s.y / height) * 100}%`,
    width: `${(s.w / width) * 100}%`,
    height: `${(s.h / height) * 100}%`,
    photoIndex: s.photoIndex,
    mirror: !!s.mirror,
    column: s.column,
    slotAspect: s.w / s.h,
  }));
}

export function getStripDividerPercent(layoutId, photoScale = PHOTO_SCALE_MAX, stripDecorId = 'none') {
  const layout = getLayout(layoutId);
  if (layout.type !== 'dual-column') return null;
  const { width, height } = getCanvasSize(layoutId);
  const slots = computePhotoSlots(layoutId, width, height, photoScale, stripDecorId);
  const left = slots.filter((s) => s.column === 'left');
  const right = slots.filter((s) => s.column === 'right');
  if (!left.length || !right.length) return null;

  const leftEnd = Math.max(...left.map((s) => s.x + s.w));
  const rightStart = Math.min(...right.map((s) => s.x));
  const midX = (leftEnd + rightStart) / 2;
  const top = Math.min(...slots.map((s) => s.y));
  const bottom = Math.max(...slots.map((s) => s.y + s.h));

  return {
    left: `${(midX / width) * 100}%`,
    top: `${(top / height) * 100}%`,
    height: `${((bottom - top) / height) * 100}%`,
  };
}

export function getCaptionAreaPercent(layoutId) {
  const layout = getLayout(layoutId);
  if (!layoutHasCaptionArea(layout.id)) return null;
  const { width, height } = getCanvasSize(layoutId);
  const { paddingBottom } = getLayoutMetrics(layout, width, height);
  return {
    left: '0%',
    top: `${((height - paddingBottom) / height) * 100}%`,
    width: '100%',
    height: `${(paddingBottom / height) * 100}%`,
  };
}
function layoutHasCaptionArea(id) {
  return id === 'strip-4' || id === 'strip-4x6';
}

/** 프레임 상단 가운데 워터마크 */
export function getBrandMarkMetrics(layoutId) {
  const layout = getLayout(layoutId);
  const { width, height } = getCanvasSize(layoutId);
  const { paddingTop } = getLayoutMetrics(layout, width, height);
  const fontSize = Math.max(
    9,
    Math.min(Math.round(paddingTop * 0.34), Math.round(width * 0.017)),
  );
  const y = Math.max(4, (paddingTop - fontSize) * 0.5);
  return {
    fontSize,
    x: width / 2,
    y,
    leftPercent: 50,
    topPercent: (y / height) * 100,
    fontSizeCqh: (fontSize / height) * 100,
  };
}

/** @deprecated use getDisplaySlots */
export function getSlotPercents(layoutId, photoScale) {
  return getDisplaySlots(layoutId, photoScale);
}

/** @deprecated */
export function getFooterPercent(layoutId) {
  return getCaptionAreaPercent(layoutId);
}

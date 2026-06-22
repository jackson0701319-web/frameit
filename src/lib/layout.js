import { getLayout, getCanvasSize, PHOTO_SCALE_MIN, PHOTO_SCALE_MAX } from './constants';

export function clampPhotoScale(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return PHOTO_SCALE_MAX;
  return Math.min(PHOTO_SCALE_MAX, Math.max(PHOTO_SCALE_MIN, Math.round(n)));
}

export function computePhotoSlots(layoutId, canvasW, canvasH, photoScale = PHOTO_SCALE_MAX) {
  const layout = getLayout(layoutId);

  if (layout.type === 'dual-column') {
    return computeDualColumnSlots(layout, canvasW, canvasH, photoScale);
  }

  const rect = scaledContentRect(layout, canvasW, canvasH, photoScale);

  switch (layout.type) {
    case 'grid-2x3':
      return computeGridSlots(layout, rect);
    default:
      return computeSingleColumnSlots(layout, rect);
  }
}

function contentRect(layout, canvasW, canvasH) {
  const top = layout.paddingTop ?? layout.padding ?? 0;
  const bottom = layout.paddingBottom ?? layout.padding ?? 0;
  const px = layout.paddingX ?? layout.padding ?? 0;
  return {
    x: px,
    y: top,
    w: canvasW - px * 2,
    h: canvasH - top - bottom,
  };
}

function scaledContentRect(layout, canvasW, canvasH, photoScale) {
  const rect = contentRect(layout, canvasW, canvasH);
  return scaleRectInCenter(rect, clampPhotoScale(photoScale) / 100);
}

/** 영역 안에서 가운데 기준 축소 (각 스트립 독립 적용용) */
function scaleRectInCenter(rect, scale) {
  if (scale >= 1) return rect;
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

function computeSingleColumnSlots(layout, rect) {
  const gap = layout.gap ?? 4;
  return fitColumnPhotos(rect, layout.photoCount, layout.photoAspect, gap);
}

/**
 * 더블 스트립 = 스트립 4컷 2장을 좌·우에 나란히 배치.
 * 사진 크기를 줄이면 각 스트립이 자기 칸 안에서만 줄고, 가운데 간격이 넓어짐.
 */
function computeDualColumnSlots(layout, canvasW, canvasH, photoScale) {
  const scaleFactor = clampPhotoScale(photoScale) / 100;
  const fullRect = contentRect(layout, canvasW, canvasH);
  const stripGap = layout.stripGap ?? 0;
  const gap = (layout.gap ?? 4) * scaleFactor;

  const stripW = (fullRect.w - stripGap) / 2;

  const leftColumn = { x: fullRect.x, y: fullRect.y, w: stripW, h: fullRect.h };
  const rightColumn = {
    x: fullRect.x + stripW + stripGap,
    y: fullRect.y,
    w: stripW,
    h: fullRect.h,
  };

  const leftPhotoArea = scaleRectInCenter(leftColumn, scaleFactor);
  const rightPhotoArea = scaleRectInCenter(rightColumn, scaleFactor);

  const leftSlots = fitColumnPhotos(
    leftPhotoArea,
    layout.photoCount,
    layout.photoAspect,
    gap,
  );
  const rightSlots = fitColumnPhotos(
    rightPhotoArea,
    layout.photoCount,
    layout.photoAspect,
    gap,
  );

  return [
    ...leftSlots.map((s, i) => ({ ...s, photoIndex: i, column: 'left' })),
    ...rightSlots.map((s, i) => ({ ...s, photoIndex: i, column: 'right', mirror: true })),
  ];
}

function computeGridSlots(layout, rect) {
  const cols = 2;
  const rows = layout.photoCount / cols;
  const gapX = layout.gapX ?? layout.gap ?? 10;
  const gapY = layout.gapY ?? layout.gap ?? 10;

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

export function getDisplaySlots(layoutId, photoScale = PHOTO_SCALE_MAX) {
  const { width, height } = getCanvasSize(layoutId);
  const slots = computePhotoSlots(layoutId, width, height, photoScale);
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

export function getStripDividerPercent(layoutId, photoScale = PHOTO_SCALE_MAX) {
  const layout = getLayout(layoutId);
  if (layout.type !== 'dual-column') return null;
  const { width, height } = getCanvasSize(layoutId);
  const slots = computePhotoSlots(layoutId, width, height, photoScale);
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
  const footerH = layout.paddingBottom ?? 48;
  return {
    left: '0%',
    top: `${((height - footerH) / height) * 100}%`,
    width: '100%',
    height: `${(footerH / height) * 100}%`,
  };
}

function layoutHasCaptionArea(id) {
  return id === 'strip-4' || id === 'strip-4x6';
}

/** 상단 여백 안·오른쪽 가장자리 (사진과 겹치지 않게) */
export function getBrandMarkMetrics(layoutId) {
  const layout = getLayout(layoutId);
  const { width, height } = getCanvasSize(layoutId);
  const padT = layout.paddingTop ?? 16;
  const padX = layout.paddingX ?? 14;

  const fontSize = Math.max(
    9,
    Math.min(Math.round(padT * 0.34), Math.round(width * 0.017)),
  );
  const y = Math.max(4, (padT - fontSize) * 0.32);
  const insetRight = Math.max(5, padX * 0.18);

  return {
    fontSize,
    x: width - insetRight,
    y,
    topPercent: (y / height) * 100,
    rightPercent: (insetRight / width) * 100,
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

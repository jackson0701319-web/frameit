import { FRAMES, getLayout, getCanvasSize, BRAND_NAME } from './constants';
import { computePhotoSlots, getBrandMarkMetrics } from './layout';
import { getFilterStyle } from './filters';
import { computeCoverSourceRect, normalizeFocus } from './photoCover';
import { drawTextOverlays } from './textOverlays';
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCoverImage(ctx, img, x, y, w, h, focus) {
  const { sx, sy, sw, sh } = computeCoverSourceRect(
    img.width,
    img.height,
    w,
    h,
    normalizeFocus(focus),
  );
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawPhotoSlot(ctx, img, slot, filterId, focus) {
  const { x, y, w, h } = slot;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const filter = getFilterStyle(filterId);
  if (filter) ctx.filter = filter;
  drawCoverImage(ctx, img, x, y, w, h, focus);
  ctx.filter = 'none';
  ctx.restore();
}

function drawBrandMark(ctx, layout, frame) {
  const { fontSize, x, y } = getBrandMarkMetrics(layout.id);

  ctx.save();
  ctx.fillStyle = frame.id === 'black' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.16)';
  ctx.font = `600 ${fontSize}px "Noto Sans KR", system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(BRAND_NAME, x, y);
  ctx.restore();
}

export async function composeStrip({
  photoSrcs,
  photoFocus = [],
  layoutId = 'strip-4',
  frameId = 'white',
  filterId = 'original',
  textOverlays = [],
  photoScale = 100,
}) {
  const layout = getLayout(layoutId);
  const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0];
  const images = await Promise.all(photoSrcs.map((src) => loadImage(src)));

  const { width, height } = getCanvasSize(layoutId);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, width, height);

  const slots = computePhotoSlots(layoutId, width, height, photoScale);
  slots.forEach((slot) => {
    const img = images[slot.photoIndex];
    if (!img) return;
    const focus = photoFocus[slot.photoIndex];
    drawPhotoSlot(ctx, img, slot, filterId, focus);
  });

  drawTextOverlays(ctx, textOverlays, width, height, frame);
  drawBrandMark(ctx, layout, frame);

  return canvas;
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, 0.95);
  });
}

export function downloadCanvas(canvas, filename = 'frameit.png') {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png', 0.95);
}

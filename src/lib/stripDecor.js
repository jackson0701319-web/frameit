import {
  getStripDecor,
  STRIP_DECOR_OPACITY_DEFAULT,
  STRIP_DECOR_OPACITY_MAX,
  STRIP_DECOR_OPACITY_MIN,
} from './constants';

export function clampStripDecorOpacity(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return STRIP_DECOR_OPACITY_DEFAULT;
  return Math.min(STRIP_DECOR_OPACITY_MAX, Math.max(STRIP_DECOR_OPACITY_MIN, Math.round(n)));
}

export function getStripDecorTextColor(frameId, opacity, variant = 'text') {
  const t = clampStripDecorOpacity(opacity) / 100;
  const isBlackFrame = frameId === 'black';
  const rgb = isBlackFrame ? '255, 255, 255' : '0, 0, 0';
  const minAlpha = variant === 'faint' ? 0.18 : 0.26;
  const alpha = minAlpha + (1 - minAlpha) * t;
  return `rgba(${rgb}, ${alpha})`;
}

function drawVerticalText(ctx, text, x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawFilmMark(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 1.1, y);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawStripDecor(
  ctx,
  stripDecorId,
  frame,
  canvasW,
  canvasH,
  metrics,
  opacity = STRIP_DECOR_OPACITY_DEFAULT,
) {
  const decor = getStripDecor(stripDecorId);
  if (decor.id === 'none') return;

  const top = metrics.paddingTop;
  const bottom = canvasH - metrics.paddingBottom;
  const bandH = bottom - top;
  const padX = metrics.paddingX;
  const textColor = getStripDecorTextColor(frame.id, opacity, 'text');
  const faintColor = getStripDecorTextColor(frame.id, opacity, 'faint');

  const fontSize = Math.max(11, Math.round(canvasW * 0.0194));
  const numSize = Math.max(7, Math.round(fontSize * 0.82));
  const markSize = Math.max(3, Math.round(fontSize * 0.38));

  ctx.save();

  decor.leftNumbers?.forEach((num, i) => {
    const y = top + bandH * (0.24 + i * 0.34);
    const x = padX * 0.36;
    ctx.font = `500 ${numSize}px system-ui, sans-serif`;
    ctx.fillStyle = faintColor;
    drawVerticalText(ctx, num, x, y, -Math.PI / 2);
    drawFilmMark(ctx, x + markSize * 2.2, y, markSize, faintColor);
  });

  decor.right?.forEach((line, i) => {
    const y = top + bandH * (0.3 + i * 0.36);
    const x = canvasW - padX * 0.4;
    const weight = line === 'FRAMEIT' ? '600' : '500';
    const size = line === 'FRAMEIT' ? fontSize * 0.92 : fontSize;
    ctx.font = `${weight} ${size}px "Noto Sans KR", system-ui, sans-serif`;
    ctx.fillStyle = line === 'FRAMEIT' ? faintColor : textColor;
    drawVerticalText(ctx, line, x, y, -Math.PI / 2);
  });

  ctx.restore();
}

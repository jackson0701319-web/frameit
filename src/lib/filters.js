const FILTER_STYLES = {
  original: '',
  /* iPhone 6 — 8MP, 부드럽고 살짝 누런 톤, 하이라이트 살짝 올림 */
  iphone6: 'contrast(92%) brightness(106%) saturate(88%) sepia(11%)',
  /* iPhone 6s — 12MP, 전형적인 애플 따뜻한 색감 */
  iphone6s: 'contrast(97%) brightness(103%) saturate(108%) sepia(6%) hue-rotate(-4deg)',
  /* iPhone SE (1세대) — 6s 센서, 조금 더 선명·깨끗한 톤 */
  'iphone-se': 'contrast(100%) brightness(101%) saturate(104%) hue-rotate(3deg)',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(80%)',
  warm: 'sepia(25%) saturate(130%) brightness(105%)',
  cool: 'saturate(90%) hue-rotate(15deg) brightness(105%)',
  vintage: 'sepia(40%) contrast(90%) brightness(95%) saturate(85%)',
  /* 필름카메라 — 살짝 바랜 톤, 따뜻한 하이라이트, 낮은 채도 */
  film: 'contrast(104%) saturate(82%) sepia(22%) brightness(103%) hue-rotate(-10deg)',
  bright: 'brightness(115%) contrast(105%) saturate(110%)',
};

export function getFilterStyle(filterId) {
  return FILTER_STYLES[filterId] ?? '';
}

export function applyFilterToContext(ctx, filterId, width, height, drawFn) {
  const style = getFilterStyle(filterId);
  if (!style) {
    drawFn();
    return;
  }

  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const offCtx = off.getContext('2d');
  drawFn.call(offCtx, offCtx);
  offCtx.filter = style;
  offCtx.drawImage(off, 0, 0);
  offCtx.filter = 'none';
  ctx.drawImage(off, 0, 0);
}

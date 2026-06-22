/** 포토이즘 인화지 규격 기반 레이아웃 */
/** @see PHOTOISM_RATIOS — 여백·간격은 캔버스 크기에 비례해 자동 계산 */

export const PHOTOISM_RATIOS = {
  /** 2×6 스트립 @ 600×1800px 실측 기준 */
  paddingX: 14 / 600,
  paddingTop: 52 / 1800,
  paddingBottom: 48 / 1800,
  /** 사진 사이 상·하·좌·우 간격 (모든 레이아웃 공통) */
  photoGap: 7 / 1800,
  /** 4×6 더블 스트립 가운데 절취선 */
  stripCenterGap: 6 / 1200,
  /** 4×6 와이드 외곽 여백 */
  cardPadding: 12 / 1200,
};

export const LAYOUTS = {
  'strip-4': {
    id: 'strip-4',
    name: '스트립 4컷',
    subtitle: '2×6 · 1:3',
    paperLabel: '1:3',
    outputWidth: 600,
    paperAspect: 1 / 3,
    photoCount: 4,
    photoAspect: 4 / 3,
    photoLabel: '4:3',
    type: 'column',
  },
  'strip-4x6': {
    id: 'strip-4x6',
    name: '4×6 더블 스트립',
    subtitle: '4×6 · 2:3 · 좌우 동일',
    paperLabel: '2:3',
    outputWidth: 1200,
    paperAspect: 2 / 3,
    photoCount: 4,
    photoAspect: 4 / 3,
    photoLabel: '4:3',
    type: 'dual-column',
  },
  'wide-6': {
    id: 'wide-6',
    name: '와이드 6컷',
    subtitle: '4×6 · 2:3',
    paperLabel: '2:3',
    outputWidth: 1200,
    paperAspect: 2 / 3,
    photoCount: 6,
    photoAspect: 1,
    photoLabel: '1:1',
    type: 'grid-2x3',
  },
};
export const LAYOUT_LIST = Object.values(LAYOUTS);

export const BRAND_NAME = 'FrameIt';

export const APP_NAME = 'FrameIt';
export const APP_TAGLINE = '사진을 프레임 안에 넣어보자';

export const FRAMES = [
  {
    id: 'white',
    name: '흰색',
    bg: '#ffffff',
    border: '#cccccc',
    text: '#222222',
    accent: '#ffffff',
  },
  {
    id: 'black',
    name: '검정색',
    bg: '#000000',
    border: '#1a1a1a',
    text: '#ffffff',
    accent: '#000000',
  },
];

export const PHOTO_SCALE_MIN = 70;
export const PHOTO_SCALE_MAX = 100;
export const PHOTO_SCALE_DEFAULT = 100;

export const CAPTION_SCALE_MIN = 35;
export const CAPTION_SCALE_MAX = 100;
export const CAPTION_SCALE_DEFAULT = 50;
/** 기본 scale(50)일 때 캔버스 높이 대비 글자 크기 비율 */
export const TEXT_HEIGHT_RATIO = 0.012;

export const PHOTO_ZOOM_MIN = 100;
export const PHOTO_ZOOM_MAX = 250;
export const PHOTO_ZOOM_DEFAULT = 100;

export const FILTERS = [
  { id: 'original', name: '원본' },
  { id: 'iphone6', name: 'iPhone 6' },
  { id: 'iphone6s', name: 'iPhone 6s' },
  { id: 'iphone-se', name: 'iPhone SE' },
  { id: 'grayscale', name: '흑백' },
  { id: 'sepia', name: '세피아' },
  { id: 'warm', name: '따뜻하게' },
  { id: 'cool', name: '시원하게' },
  { id: 'vintage', name: '빈티지' },
  { id: 'film', name: '필름카메라' },
  { id: 'bright', name: '밝게' },
];

export function getLayout(layoutId) {
  return LAYOUTS[layoutId] ?? LAYOUTS['strip-4'];
}

export function getCanvasSize(layoutId) {
  const layout = getLayout(layoutId);
  const width = layout.outputWidth;
  const height = Math.round(width / layout.paperAspect);
  return { width, height };
}

export function getEmptyPhotos(layoutId) {
  const count = getLayout(layoutId).photoCount;
  return Array(count).fill(null);
}

export function getEmptyPhotoFocus(layoutId) {
  const count = getLayout(layoutId).photoCount;
  return Array.from({ length: count }, () => ({ x: 50, y: 50, zoom: PHOTO_ZOOM_DEFAULT }));
}

/** 레이아웃별 하단 문구 영역 (스트립 계열만) */
export function layoutHasCaption(layoutId) {
  const id = getLayout(layoutId).id;
  return id === 'strip-4' || id === 'strip-4x6';
}

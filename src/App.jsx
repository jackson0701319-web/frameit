import { useState, useCallback } from 'react';
import InteractiveFrame from './components/InteractiveFrame';
import LayoutPicker from './components/LayoutPicker';
import FramePicker from './components/FramePicker';
import FilterPanel from './components/FilterPanel';
import TextControls from './components/TextControls';
import PhotoScaleControl from './components/PhotoScaleControl';
import ExportBar from './components/ExportBar';
import { composeStrip } from './lib/composeStrip';
import {
  getEmptyPhotos,
  getEmptyPhotoFocus,
  getLayout,
  PHOTO_SCALE_DEFAULT,
  APP_NAME,
  APP_TAGLINE,
} from './lib/constants';
import { createTextOverlay, normalizeTextOverlay } from './lib/textOverlays';
import AdBanner from './components/AdBanner';
import './App.css';

export default function App() {
  const [layoutId, setLayoutId] = useState('strip-4');
  const [photos, setPhotos] = useState(() => getEmptyPhotos('strip-4'));
  const [photoFocus, setPhotoFocus] = useState(() => getEmptyPhotoFocus('strip-4'));
  const [frameId, setFrameId] = useState('white');
  const [filterId, setFilterId] = useState('original');
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [photoScale, setPhotoScale] = useState(PHOTO_SCALE_DEFAULT);
  const [isExporting, setIsExporting] = useState(false);

  const layout = getLayout(layoutId);
  const filledCount = photos.filter(Boolean).length;
  const isReady = filledCount === layout.photoCount;

  const handleLayoutChange = (nextLayoutId) => {
    setLayoutId(nextLayoutId);
    const nextCount = getLayout(nextLayoutId).photoCount;
    setPhotos((prev) => {
      const next = getEmptyPhotos(nextLayoutId);
      for (let i = 0; i < Math.min(prev.length, nextCount); i++) {
        next[i] = prev[i];
      }
      for (let i = nextCount; i < prev.length; i++) {
        if (prev[i]?.startsWith('blob:')) URL.revokeObjectURL(prev[i]);
      }
      return next;
    });
    setPhotoFocus((prev) => {
      const next = getEmptyPhotoFocus(nextLayoutId);
      for (let i = 0; i < Math.min(prev.length, nextCount); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  };

  const handlePhotoFocusChange = useCallback((index, focus) => {
    setPhotoFocus((prev) => {
      const next = [...prev];
      next[index] = focus;
      return next;
    });
  }, []);

  const handleReorder = useCallback((from, to) => {
    setPhotos((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setPhotoFocus((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const handleAddText = useCallback(() => {
    const overlay = createTextOverlay();
    setTextOverlays((prev) => [...prev, overlay]);
    setSelectedTextId(overlay.id);
  }, []);

  const handleUpdateText = useCallback((id, patch) => {
    setTextOverlays((prev) => prev.map((o) => (
      o.id === id ? normalizeTextOverlay({ ...o, ...patch }) : o
    )));
  }, []);

  const handleMoveText = useCallback((id, nextOverlay) => {
    setTextOverlays((prev) => prev.map((o) => (
      o.id === id ? normalizeTextOverlay(nextOverlay) : o
    )));
  }, []);

  const handleRemoveText = useCallback((id) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedTextId((prev) => (prev === id ? null : prev));
  }, []);

  const handleExport = useCallback(async () => {
    if (!isReady) return null;
    setIsExporting(true);
    try {
      return await composeStrip({
        photoSrcs: photos,
        photoFocus,
        layoutId,
        frameId,
        filterId,
        textOverlays,
        photoScale,
      });
    } finally {
      setIsExporting(false);
    }
  }, [photos, photoFocus, layoutId, frameId, filterId, textOverlays, photoScale, isReady]);

  const handleReset = () => {
    photos.forEach((src) => {
      if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
    });
    setPhotos(getEmptyPhotos(layoutId));
    setPhotoFocus(getEmptyPhotoFocus(layoutId));
    setTextOverlays([]);
    setSelectedTextId(null);
    setFrameId('white');
    setFilterId('original');
    setPhotoScale(PHOTO_SCALE_DEFAULT);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <span className="header__logo" aria-hidden="true">
            <span className="header__logo-mark" />
          </span>
          <div>
            <h1>{APP_NAME}</h1>
            <p>{APP_TAGLINE}</p>
          </div>
        </div>
        <span className="header__badge">사진은 브라우저에서만 처리됩니다</span>
      </header>

      <AdBanner variant="top" />

      <main className="main">
        <section className="preview-section">
          <InteractiveFrame
            layoutId={layoutId}
            frameId={frameId}
            filterId={filterId}
            photos={photos}
            photoFocus={photoFocus}
            textOverlays={textOverlays}
            selectedTextId={selectedTextId}
            onTextSelect={setSelectedTextId}
            onTextMove={handleMoveText}
            photoScale={photoScale}
            onPhotosChange={setPhotos}
            onPhotoFocusChange={handlePhotoFocusChange}
            onReorder={handleReorder}
          />
          <div className="preview-toolbar">
            <PhotoScaleControl value={photoScale} onChange={setPhotoScale} />
            <ExportBar
              onExport={handleExport}
              disabled={!isReady || isExporting}
              isExporting={isExporting}
            />
          </div>
        </section>

        <section className="controls-section">
          <AdBanner variant="sidebar" />

          <div className="panel">
            <h2>레이아웃</h2>
            <LayoutPicker selected={layoutId} onChange={handleLayoutChange} />
          </div>

          <div className="panel">
            <h2>프레임 색상</h2>
            <FramePicker selected={frameId} onChange={setFrameId} />
          </div>

          <div className="panel">
            <h2>필터</h2>
            <FilterPanel selected={filterId} onChange={setFilterId} />
          </div>

          <div className="panel">
            <h2>텍스트</h2>
            <TextControls
              overlays={textOverlays}
              selectedId={selectedTextId}
              onSelect={setSelectedTextId}
              onAdd={handleAddText}
              onUpdate={handleUpdateText}
              onRemove={handleRemoveText}
            />
          </div>

          <button type="button" className="btn-reset" onClick={handleReset}>
            처음부터 다시
          </button>
        </section>
      </main>

      <footer className="footer">
        <p>{APP_NAME} — 스트립 1:3 · 4×6 더블 · 와이드 6컷</p>
      </footer>
    </div>
  );
}

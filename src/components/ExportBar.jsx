import { downloadCanvas, canvasToBlob } from '../lib/composeStrip';
import { APP_NAME } from '../lib/constants';

export default function ExportBar({ onExport, disabled, isExporting }) {
  const handleDownload = async () => {
    const canvas = await onExport();
    if (!canvas) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadCanvas(canvas, `frameit-${date}.png`);
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const canvas = await onExport();
      if (!canvas) return;
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], 'frameit.png', { type: 'image/png' });
      await navigator.share({
        title: APP_NAME,
        text: '내가 만든 프레임 사진!',
        files: [file],
      });    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  const canShare = typeof navigator.share === 'function';

  return (
    <div className="export-bar">
      <button
        type="button"
        className="btn-primary"
        onClick={handleDownload}
        disabled={disabled || isExporting}
      >
        {isExporting ? '생성 중…' : 'PNG 저장'}
      </button>
      {canShare && (
        <button
          type="button"
          className="btn-secondary"
          onClick={handleShare}
          disabled={disabled || isExporting}
        >
          공유하기
        </button>
      )}
      {!disabled ? null : (
        <p className="export-bar__hint">모든 칸에 사진이 들어가면 저장할 수 있어요</p>
      )}
    </div>
  );
}

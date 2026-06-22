/**
 * 배너 광고 슬롯 — 실제 광고 스크립트는 .ad-slot__frame 안에 삽입하면 됩니다.
 * @param {'top' | 'sidebar'} variant
 */
export default function AdBanner({ variant = 'top', className = '' }) {
  const sizeLabel = variant === 'top' ? '728 × 90' : '300 × 250';

  return (
    <aside
      className={`ad-slot ad-slot--${variant} ${className}`.trim()}
      role="complementary"
      aria-label="광고"
      data-ad-slot={variant}
    >
      <span className="ad-slot__label">광고</span>
      <div className="ad-slot__frame">
        <div className="ad-slot__placeholder" aria-hidden="true">
          <span className="ad-slot__placeholder-text">배너 광고</span>
          <span className="ad-slot__placeholder-size">{sizeLabel}</span>
        </div>
      </div>
    </aside>
  );
}

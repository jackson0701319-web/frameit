import { useEffect, useRef, useState } from 'react';
import {
  getAdSenseClient,
  getAdSenseSlot,
  isAdSenseConfigured,
  loadAdSenseScript,
  pushAdSenseSlot,
} from '../lib/adsense';

const SLOT_LAYOUT = {
  top: {
    sizeLabel: '728 × 90',
    fixedSize: { width: 728, height: 90 },
  },
  sidebar: {
    sizeLabel: '300 × 80',
    fixedSize: { width: 300, height: 80 },
  },
};

/**
 * @param {'top' | 'sidebar'} variant
 */
export default function AdBanner({ variant = 'top', className = '' }) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const configured = isAdSenseConfigured(variant);
  const client = getAdSenseClient();
  const slot = getAdSenseSlot(variant);
  const layout = SLOT_LAYOUT[variant] ?? SLOT_LAYOUT.top;

  useEffect(() => {
    if (!configured) return undefined;

    let cancelled = false;

    loadAdSenseScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, client]);

  useEffect(() => {
    if (!ready || !configured || !frameRef.current) return;
    pushAdSenseSlot(frameRef.current);
  }, [ready, configured, slot, variant]);

  return (
    <aside
      className={`ad-slot ad-slot--${variant} ${className}`.trim()}
      role="complementary"
      aria-label="광고"
      data-ad-slot={variant}
    >
      <span className="ad-slot__label">광고</span>
      <div className="ad-slot__frame" ref={frameRef}>
        {configured && ready ? (
          layout.fixedSize ? (
            <ins
              className="adsbygoogle"
              style={{
                display: 'inline-block',
                width: `${layout.fixedSize.width}px`,
                height: `${layout.fixedSize.height}px`,
                maxWidth: '100%',
              }}
              data-ad-client={client}
              data-ad-slot={slot}
            />
          ) : (
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={client}
              data-ad-slot={slot}
              data-ad-format={layout.adFormat}
              data-full-width-responsive={layout.fullWidthResponsive ? 'true' : 'false'}
            />
          )
        ) : (
          <div className="ad-slot__placeholder" aria-hidden="true">
            <span className="ad-slot__placeholder-text">
              {configured ? '광고 불러오는 중…' : '배너 광고'}
            </span>
            <span className="ad-slot__placeholder-size">{layout.sizeLabel}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

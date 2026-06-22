import { getLayout, getCanvasSize, getStripDecor } from '../lib/constants';
import { getLayoutMetrics } from '../lib/layout';
import { getStripDecorTextColor } from '../lib/stripDecor';

export default function StripDecorOverlay({ layoutId, frameId, stripDecorId, stripDecorOpacity = 85 }) {
  const decor = getStripDecor(stripDecorId);
  if (decor.id === 'none') return null;

  const layout = getLayout(layoutId);
  const { width, height } = getCanvasSize(layoutId);
  const metrics = getLayoutMetrics(layout, width, height, stripDecorId);
  const textColor = getStripDecorTextColor(frameId, stripDecorOpacity, 'text');
  const faintColor = getStripDecorTextColor(frameId, stripDecorOpacity, 'faint');

  const topPct = (metrics.paddingTop / height) * 100;
  const bottomPct = (metrics.paddingBottom / height) * 100;
  const sidePct = (metrics.paddingX / width) * 100;
  const bandHeight = 100 - topPct - bottomPct;

  return (
    <>
      <div
        className="strip-decor strip-decor--left"
        style={{
          top: `${topPct}%`,
          width: `${sidePct}%`,
          height: `${bandHeight}%`,
        }}
        aria-hidden="true"
      >
        {decor.leftNumbers?.map((num, i) => (
          <span
            key={num}
            className="strip-decor__left-item"
            style={{ top: `${24 + i * 34}%`, color: faintColor }}
          >
            <span className="strip-decor__mark" />
            <span className="strip-decor__num">{num}</span>
          </span>
        ))}
      </div>

      <div
        className="strip-decor strip-decor--right"
        style={{
          top: `${topPct}%`,
          width: `${sidePct}%`,
          height: `${bandHeight}%`,
        }}
        aria-hidden="true"
      >
        {decor.right?.map((line, i) => (
          <span
            key={line}
            className={`strip-decor__vertical ${line === 'FRAMEIT' ? 'strip-decor__vertical--brand' : ''}`}
            style={{
              top: `${30 + i * 36}%`,
              color: line === 'FRAMEIT' ? faintColor : textColor,
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </>
  );
}

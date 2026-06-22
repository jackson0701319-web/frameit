import { Fragment } from 'react';
import { getLayout, getCanvasSize, getStripDecor } from '../lib/constants';
import { getDualStripColumnGeometry, getLayoutMetrics, getHalfStripDecorPadding } from '../lib/layout';
import { getStripDecorTextColor } from '../lib/stripDecor';

function StripDecorColumn({
  decor,
  faintColor,
  textColor,
  topPct,
  bandHeight,
  leftPct,
  rightLeftPct,
  sidePct,
}) {
  return (
    <Fragment>
      <div
        className="strip-decor strip-decor--left"
        style={{
          left: `${leftPct}%`,
          right: 'auto',
          width: `${sidePct}%`,
          top: `${topPct}%`,
          height: `${bandHeight}%`,
        }}
        aria-hidden="true"
      >
        {decor.leftNumbers?.map((num, i) => (
          <span
            key={`${leftPct}-num-${num}`}
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
          left: `${rightLeftPct}%`,
          right: 'auto',
          width: `${sidePct}%`,
          top: `${topPct}%`,
          height: `${bandHeight}%`,
        }}
        aria-hidden="true"
      >
        {decor.right?.map((line, i) => (
          <span
            key={`${rightLeftPct}-line-${line}`}
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
    </Fragment>
  );
}

export default function StripDecorOverlay({ layoutId, frameId, stripDecorId, stripDecorOpacity = 85 }) {
  const decor = getStripDecor(stripDecorId);
  if (decor.id === 'none') return null;

  const layout = getLayout(layoutId);
  const { width, height } = getCanvasSize(layoutId);
  const metrics = getLayoutMetrics(layout, width, height, stripDecorId);
  const textColor = getStripDecorTextColor(frameId, stripDecorOpacity, 'text');
  const faintColor = getStripDecorTextColor(frameId, stripDecorOpacity, 'faint');

  const topPct = (metrics.paddingTop / height) * 100;
  const bandHeight = 100 - (metrics.paddingTop / height) * 100 - (metrics.paddingBottom / height) * 100;

  if (layout.type === 'dual-column') {
    const { columns, halfW } = getDualStripColumnGeometry(width);
    const padX = getHalfStripDecorPadding(halfW, stripDecorId);
    const sidePct = (padX / width) * 100;

    return (
      <>
        {columns.map(({ columnX }, index) => (
          <StripDecorColumn
            key={`strip-decor-${index}`}
            decor={decor}
            faintColor={faintColor}
            textColor={textColor}
            topPct={topPct}
            bandHeight={bandHeight}
            leftPct={(columnX / width) * 100}
            rightLeftPct={((columnX + halfW - padX) / width) * 100}
            sidePct={sidePct}
          />
        ))}
      </>
    );
  }

  const padX = metrics.paddingX;
  const sidePct = (padX / width) * 100;

  return (
    <StripDecorColumn
      decor={decor}
      faintColor={faintColor}
      textColor={textColor}
      topPct={topPct}
      bandHeight={bandHeight}
      leftPct={0}
      rightLeftPct={((width - padX) / width) * 100}
      sidePct={sidePct}
    />
  );
}

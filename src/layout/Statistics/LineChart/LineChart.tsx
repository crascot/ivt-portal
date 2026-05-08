import { FaChartLine } from 'react-icons/fa';
import s from '../Statistics.module.css';

export const LineChart = ({
  items,
  title,
}: {
  items: { key: string; label: string; count: number }[];
  title: string;
}) => {
  const maxValue = Math.max(...items.map((item) => item.count), 1);
  const points = items
    .map((item, index) => {
      const x = items.length > 1 ? (index * 360) / (items.length - 1) : 180;
      const y = 150 - (item.count / maxValue) * 118;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <article className={`${s.panel} ${s.widePanel}`}>
      <div className={s.panelTitle}>
        <FaChartLine />
        <h2>{title}</h2>
      </div>

      <div className={s.lineChart}>
        <svg viewBox="0 0 360 170" role="img" aria-label={title}>
          <polyline className={s.gridLine} points="0,145 360,145" />
          <polyline className={s.gridLine} points="0,90 360,90" />
          <polyline className={s.line} points={points} />
          {items.map((item, index) => {
            const x =
              items.length > 1 ? (index * 360) / (items.length - 1) : 180;
            const y = 150 - (item.count / maxValue) * 118;

            return (
              <g key={item.key}>
                <circle className={s.linePoint} cx={x} cy={y} r="4" />
                <text className={s.pointLabel} x={x} y={y - 10}>
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>

        <div className={s.weekLabels}>
          {items.map((item) => (
            <span key={item.key}>{item.label}</span>
          ))}
        </div>
      </div>
    </article>
  );
};

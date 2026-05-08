import s from './MetricCard.module.css';

export const MetricCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: JSX.Element;
  label: string;
  value: number | string;
  tone: 'blue' | 'green' | 'amber' | 'red';
}) => (
  <article className={s.metricCard}>
    <span className={`${s.metricIcon} ${s[tone]}`}>{icon}</span>
    <small>{label}</small>
    <strong>{value}</strong>
  </article>
);

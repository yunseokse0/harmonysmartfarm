import './Metric.css';

interface MetricProps {
  label: string;
  value: number | string | null;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function Metric({
  label,
  value,
  unit = '',
  status = 'normal',
  trend,
  icon,
  onClick,
}: MetricProps) {
  const displayValue = value !== null ? `${value}${unit}` : '--';

  return (
    <div
      className={`metric metric-${status} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {icon && <div className="metric-icon">{icon}</div>}
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {displayValue}
          {trend && (
            <span className={`metric-trend trend-${trend}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      </div>
      {status !== 'normal' && (
        <div className={`metric-status status-${status}`}></div>
      )}
    </div>
  );
}


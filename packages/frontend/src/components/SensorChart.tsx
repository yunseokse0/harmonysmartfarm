import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './SensorChart.css';

interface DataPoint {
  time: string;
  value: number;
}

interface SensorChartProps {
  data: DataPoint[];
  name: string;
  unit?: string;
  color?: string;
}

export default function SensorChart({ data, name, unit = '', color = '#3498db' }: SensorChartProps) {
  const chartData = data.map((point) => ({
    time: new Date(point.time).toLocaleTimeString(),
    value: point.value,
  }));

  return (
    <div className="sensor-chart-container">
      <h3 className="chart-title">{name}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: unit, angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


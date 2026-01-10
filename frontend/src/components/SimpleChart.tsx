import { ChartData } from '../types';

interface SimpleChartProps {
  data: ChartData;
}

export default function SimpleChart({ data }: SimpleChartProps) {
  if (data.type === 'bar') {
    const maxValue = Math.max(...data.datasets[0].data);

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-700">{data.datasets[0].label}</h4>
        <div className="space-y-3">
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = (value / maxValue) * 100;

            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{label}</span>
                  <span className="font-medium text-slate-900">{value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-900 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (data.type === 'line') {
    const maxValue = Math.max(...data.datasets[0].data);
    const minValue = Math.min(...data.datasets[0].data);
    const range = maxValue - minValue;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-700">{data.datasets[0].label}</h4>
        <div className="relative h-64 border-l border-b border-slate-300">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2"
              points={data.datasets[0].data
                .map((value, index) => {
                  const x = (index / (data.datasets[0].data.length - 1)) * 400;
                  const y = 200 - ((value - minValue) / range) * 180 - 10;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 -mb-6">
            {data.labels.map((label, index) => (
              <span key={index} className="text-xs text-slate-600">{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.type === 'pie') {
    const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
    const colors = ['#1e3a8a', '#475569', '#0d9488', '#64748b', '#0f766e', '#334155'];

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-700">{data.datasets[0].label}</h4>
        <div className="space-y-2">
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = ((value / total) * 100).toFixed(1);

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {percentage}% ({value.toLocaleString()})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

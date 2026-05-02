interface Props {
  percent: number;
  label?: string;
}

export function ProgressBar({ percent, label }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        {label && <span className="text-xs text-slate-400">{label}</span>}
        <span className="text-xs text-slate-400 ml-auto">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

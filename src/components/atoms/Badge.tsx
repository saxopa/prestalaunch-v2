type Color = "blue" | "green" | "yellow" | "red";

interface Props {
  color?: Color;
  children: React.ReactNode;
}

const colorClass: Record<Color, string> = {
  blue: "bg-brand-500/10 text-brand-400",
  green: "bg-success/10 text-success",
  yellow: "bg-warning/10 text-warning",
  red: "bg-danger/10 text-danger",
};

export function Badge({ color = "blue", children }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass[color]}`}>
      {children}
    </span>
  );
}

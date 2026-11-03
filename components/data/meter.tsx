export function Meter({
  label,
  value,
  max,
  display,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  tone?: "primary" | "muted" | "danger";
}) {
  const width = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{display}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={
            tone === "danger"
              ? "h-full rounded-full bg-destructive"
              : tone === "primary"
                ? "h-full rounded-full bg-primary"
                : "h-full rounded-full bg-foreground/35"
          }
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

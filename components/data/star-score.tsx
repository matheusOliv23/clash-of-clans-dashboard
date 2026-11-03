import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarScore({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn(
            "size-3.5",
            index < value
              ? "fill-primary text-primary"
              : "text-muted-foreground/35",
          )}
        />
      ))}
    </span>
  );
}

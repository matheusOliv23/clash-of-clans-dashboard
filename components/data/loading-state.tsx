import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
  label = "Carregando painel",
  variant = "page",
}: {
  label?: string;
  variant?: "page" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex flex-col gap-3"
      >
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

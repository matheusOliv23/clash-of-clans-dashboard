import { TriangleAlert } from "lucide-react";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
    >
      <TriangleAlert className="size-5 text-red-200" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

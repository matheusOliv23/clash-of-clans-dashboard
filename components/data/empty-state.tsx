import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

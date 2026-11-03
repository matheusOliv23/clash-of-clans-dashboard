import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "demonstracao"
  | "nao-sincronizado"
  | "em-guerra"
  | "preparacao"
  | "pendente"
  | "concluido"
  | "vitoria"
  | "derrota"
  | "empate";

const labels: Record<StatusTone, string> = {
  demonstracao: "Demonstração",
  "nao-sincronizado": "Não sincronizado",
  "em-guerra": "Em guerra",
  preparacao: "Preparação",
  pendente: "Pendente",
  concluido: "Concluído",
  vitoria: "Vitória",
  derrota: "Derrota",
  empate: "Empate",
};

const tones: Record<StatusTone, string> = {
  demonstracao: "border-primary/30 bg-primary/15 text-primary",
  "nao-sincronizado": "border-border bg-muted text-muted-foreground",
  "em-guerra": "border-primary/30 bg-primary/15 text-primary",
  preparacao: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  pendente: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  concluido: "border-primary/30 bg-primary/10 text-primary",
  vitoria: "border-primary/30 bg-primary/15 text-primary",
  derrota: "border-destructive/40 bg-destructive/15 text-red-200",
  empate: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("h-6 px-2.5", tones[tone], className)}
    >
      {label ?? labels[tone]}
    </Badge>
  );
}

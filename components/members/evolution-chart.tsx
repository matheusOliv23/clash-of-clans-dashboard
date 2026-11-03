"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MemberSeriesPoint } from "@/features/members/metrics";

export function EvolutionChart({ points }: { points: MemberSeriesPoint[] }) {
  const data = points
    .filter((point) => point.averageDestruction !== null)
    .map((point) => ({
      label: new Date(point.endTime).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      opponent: point.opponentName,
      destruction: point.averageDestruction,
      stars: point.averageStars,
    }));

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há ataques em guerras finalizadas para desenhar a evolução.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="oklch(1 0 0 / 0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "oklch(0.75 0 0)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "oklch(0.75 0 0)", fontSize: 12 }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.2 0.02 150)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              borderRadius: 12,
            }}
            formatter={(value, name) => [
              typeof value === "number"
                ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
                : "—",
              name === "destruction" ? "Destruição média" : "Estrelas médias",
            ]}
            labelFormatter={(_label, payload) => {
              const opponent = payload?.[0]?.payload?.opponent;
              return typeof opponent === "string" ? opponent : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="destruction"
            name="destruction"
            stroke="oklch(0.78 0.17 150)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

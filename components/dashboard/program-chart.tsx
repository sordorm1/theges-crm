"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ExamProgram } from "@/lib/types";

export function ProgramChart({
  data,
}: {
  data: { program: ExamProgram; count: number }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Популярность курсов</h3>
        <p className="text-xs text-muted-foreground">за этот год, по числу учеников</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey={(d: { program: ExamProgram }) => d.program.shortName}
            width={90}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 13,
            }}
            formatter={(value) => [`${value} учеников`, ""]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d) => (
              <Cell key={d.program.id} fill={d.program.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

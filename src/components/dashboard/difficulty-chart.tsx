'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DifficultyData {
  name: 'Easy' | 'Medium' | 'Hard';
  correct: number;
  incorrect: number;
}

interface DifficultyChartProps {
  data: DifficultyData[];
}

export function DifficultyChart({ data }: DifficultyChartProps) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={60} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Legend wrapperStyle={{ paddingBottom: '20px' }} />
          <Bar dataKey="correct" stackId="a" fill="#2ECC71" name="Correct" />
          <Bar dataKey="incorrect" stackId="a" fill="#E74C3C" name="Incorrect" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

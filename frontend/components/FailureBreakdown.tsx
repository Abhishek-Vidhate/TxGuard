'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FailureBreakdownProps {
  catalog: {
    slippageExceeded: number;
    insufficientLiquidity: number;
    mevDetected: number;
    droppedTx: number;
    insufficientFunds: number;
    other: number;
  };
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--destructive))'
];

/**
 * Failure Breakdown Chart component
 * Shows pie chart of failure types
 */
export function FailureBreakdown({ catalog }: FailureBreakdownProps) {
  const data = [
    { name: 'Slippage', value: catalog.slippageExceeded },
    { name: 'Liquidity', value: catalog.insufficientLiquidity },
    { name: 'MEV', value: catalog.mevDetected },
    { name: 'Dropped', value: catalog.droppedTx },
    { name: 'Insufficient Funds', value: catalog.insufficientFunds },
    { name: 'Other', value: catalog.other }
  ].filter(item => item.value > 0);

  const totalFailures = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failure Breakdown</CardTitle>
        <CardDescription>
          {totalFailures} total failures categorized by type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value} (${((entry.value / totalFailures) * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No failures recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

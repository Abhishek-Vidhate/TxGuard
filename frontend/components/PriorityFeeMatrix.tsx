'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface PriorityFeeMatrixProps {
  tiers: number[];
}

/**
 * Priority Fee Matrix component
 * Shows distribution of priority fee tiers used
 */
export function PriorityFeeMatrix({ tiers }: PriorityFeeMatrixProps) {
  const tierNames = ['Free', 'Low', 'Medium', 'High', 'Premium'];
  
  const data = tiers.map((count, index) => ({
    tier: tierNames[index],
    count: count,
    percentage: tiers.reduce((sum, c) => sum + c, 0) > 0
      ? (count / tiers.reduce((sum, c) => sum + c, 0)) * 100
      : 0,
    color: `var(--chart-${(index % 5) + 1})`,
  })).filter(item => item.count > 0);

  const totalTxs = tiers.reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Fee Tier Usage</CardTitle>
        <CardDescription>
          {totalTxs} transactions across {tierNames.length} priority fee tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <ChartContainer config={{ count: { label: 'Transaction Count', color: 'var(--chart-1)' } }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--muted-foreground) / 0.17)" />
                  <XAxis dataKey="tier" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", color: "hsl(var(--foreground))", border: 0 }} />
                  <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Transaction Count" fill="var(--color-count)">
                    {data.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <div className="flex flex-wrap gap-2">
              {data.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {item.tier}: {item.count} ({item.percentage.toFixed(1)}%)
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No priority fee data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

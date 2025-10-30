'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SuccessRateChartProps {
  data: number[];
}

/**
 * Success Rate Chart component
 * Shows transaction success rate over time
 */
export function SuccessRateChart({ data }: SuccessRateChartProps) {
  // Convert last 100 outcomes to chart data
  const chartData = data
    .map((outcome, index) => {
      // Outcome: 0=failure, 1=success, 2=pending
      return {
        name: `Tx ${index + 1}`,
        value: outcome === 1 ? 100 : outcome === 0 ? 0 : 50 // Success=100%, Failure=0%, Pending=50%
      };
    })
    .filter((item) => item.value !== 50); // Filter out pending

  // Calculate running average
  let runningAvg = 0;
  const chartDataWithAvg = chartData.map((item) => {
    runningAvg = (runningAvg + item.value) / 2;
    return {
      ...item,
      average: runningAvg
    };
  });

  const successCount = data.filter(o => o === 1).length;
  const failureCount = data.filter(o => o === 0).length;
  const totalCount = successCount + failureCount;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Success Rate</CardTitle>
        <CardDescription>
          {successCount} successful, {failureCount} failed out of {totalCount} transactions ({successRate.toFixed(1)}% success rate)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ value: { color: 'var(--chart-1)' }, average: { color: 'var(--chart-2)' } }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartDataWithAvg} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="srGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--muted-foreground) / 0.17)" />
              <XAxis dataKey="name" hide stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", color: "hsl(var(--foreground))", border: 0 }} content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.2)' }} />
              <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="url(#srGradient)" fillOpacity={1} name="Success Rate" />
              <Area type="monotone" dataKey="average" stroke="var(--color-average)" strokeWidth={2} fillOpacity={0} name="Running Average" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
        <ChartContainer config={{ value: { color: 'hsl(var(--chart-1))' } }}>
          <AreaChart data={chartDataWithAvg} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--chart-1))" 
              fill="hsl(var(--chart-1))" 
              fillOpacity={0.6}
              name="Success Rate"
            />
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke="hsl(var(--chart-2))" 
              fillOpacity={0}
              name="Running Average"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

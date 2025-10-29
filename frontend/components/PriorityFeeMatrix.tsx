'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      : 0
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Transaction Count" />
              </BarChart>
            </ResponsiveContainer>
            
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

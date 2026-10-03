'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthChartsProps {
  cpuData: { time: string; value: number }[];
  memoryData: { time: string; value: number }[];
  storageData: { time: string; value: number }[];
}

export default function HealthCharts({ cpuData, memoryData, storageData }: HealthChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          System performance over the last 12 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cpu">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="cpu">CPU Usage</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="storage">Storage Growth</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cpu">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'CPU Usage']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2} 
                    dot={false} 
                    name="CPU Usage" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="memory">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Memory Usage']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Memory Usage" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="storage">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={storageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Storage Usage']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Storage Usage" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

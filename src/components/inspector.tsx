"use client";

import type { StepData, StepId } from "@/lib/types";
import { STEP_COLORS } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface InspectorProps {
  stepId: StepId;
  data: StepData;
}

export function Inspector({ stepId, data }: InspectorProps) {
  const colorClass = STEP_COLORS[stepId];

  return (
    <Card className="overflow-hidden p-0 gap-0">
      <Tabs defaultValue="headers" className="gap-0">
        <div className="flex items-center border-b border-border px-2 py-1.5">
          <TabsList variant="line" className="h-auto">
            <TabsTrigger value="headers" className="px-3 py-1.5 text-xs">
              Headers
            </TabsTrigger>
            <TabsTrigger value="body" className="px-3 py-1.5 text-xs">
              Body
            </TabsTrigger>
          </TabsList>
          {data.statusCode !== undefined && (
            <div className="ml-auto px-2">
              <span className={`text-xs font-medium ${colorClass}`}>
                {data.statusCode}
              </span>
            </div>
          )}
        </div>

        <TabsContent value="headers" className="p-4 overflow-auto max-h-96">
          <div className="space-y-4">
            {data.requestHeaders &&
              Object.keys(data.requestHeaders).length > 0 && (
                <HeaderSection
                  title="Request Headers"
                  headers={data.requestHeaders}
                />
              )}
            {data.responseHeaders &&
              Object.keys(data.responseHeaders).length > 0 && (
                <HeaderSection
                  title="Response Headers"
                  headers={data.responseHeaders}
                />
              )}
          </div>
        </TabsContent>

        <TabsContent value="body" className="p-4 overflow-auto max-h-96">
          <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all font-mono">
            {data.body ? JSON.stringify(data.body, null, 2) : "No body"}
          </pre>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function HeaderSection({
  title,
  headers,
}: {
  title: string;
  headers: Record<string, string>;
}) {
  return (
    <div>
      <h4 className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1 font-mono">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="text-primary shrink-0">{key}:</span>
            <span className="text-muted-foreground break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

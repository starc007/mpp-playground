"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";

export default function HtmlBuilderPage() {
  return (
    <DashboardLayout
      title="HTML Builder"
      description="Visual customizer for your payment page UI. Style the mppx-rendered payment form with colors, text, and layout overrides — no code required."
    >
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">Coming soon.</p>
        <p className="text-xs text-text-dim mt-2">
          This will let you tweak <code>Html.init</code> theme tokens and text
          overrides with a live preview.
        </p>
      </Card>
    </DashboardLayout>
  );
}

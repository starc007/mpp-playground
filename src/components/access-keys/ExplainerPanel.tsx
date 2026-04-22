import { Info } from "lucide-react";

export function ExplainerPanel() {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-dashed border-border/60 bg-muted/20">
      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
        <Info className="size-4" />
      </div>
      <div className="space-y-1.5 text-xs">
        <p className="font-medium text-foreground">What are access keys?</p>
        <p className="text-muted-foreground leading-relaxed">
          Access keys let you authorize an AI agent with a separate keypair and
          strict spending limits. Enforced at the chain level via TIP-1011 —
          even a compromised agent can&apos;t exceed its limits.
        </p>
      </div>
    </div>
  );
}

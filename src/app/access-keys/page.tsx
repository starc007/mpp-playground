"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { AnimatePresence } from "motion/react";
import { KeyRound, Plus, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccessKeys } from "@/hooks/use-access-keys";
import { KeyCard } from "@/components/access-keys/KeyCard";
import { CreateKeyDrawer } from "@/components/access-keys/CreateKeyDrawer";
import { ExplainerPanel } from "@/components/access-keys/ExplainerPanel";

export default function AccessKeysPage() {
  const { isConnected } = useAccount();
  const { keys, loading, refresh } = useAccessKeys();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <DashboardLayout
      title="Access Keys"
      description="Scoped spending keys for AI agents. Chain-enforced spending limits and expiry via TIP-1011."
    >
      {!isConnected ? (
        <EmptyState
          icon={<Shield className="size-5 text-muted-foreground" />}
          title="Connect your wallet"
          description="Connect a Tempo wallet to manage access keys."
        />
      ) : (
        <div className="space-y-6">
          <ExplainerPanel />

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">
                  Your Access Keys
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {keys.length === 0
                    ? "no keys yet"
                    : `${keys.length} key${keys.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3" />
                Create key
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Loading…
                </p>
              ) : keys.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <KeyRound className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    No access keys yet. Create one to give an agent scoped
                    spending power.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {keys.map((key) => (
                      <KeyCard
                        key={key.address}
                        entry={key}
                        onRevoked={refresh}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateKeyDrawer
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="rounded-xl bg-muted/50 p-3">{icon}</div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

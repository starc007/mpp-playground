"use client";

import { Header, Footer } from "@/components/layout";
import { useNetwork } from "@/components/providers";
import { NavTabs } from "@/components/nav-tabs";

export default function HtmlBuilderPage() {
  const { network, setNetwork } = useNetwork();

  return (
    <div className="flex flex-col min-h-screen">
      <Header network={network} onNetworkChange={setNetwork} />

      <main className="flex-1 px-8 py-8 pt-24 max-w-6xl mx-auto w-full space-y-8">
        <NavTabs />

        <div>
          <h2 className="text-lg font-semibold text-text mb-1">
            HTML Builder
          </h2>
          <p className="text-xs text-text-muted">
            Visual customizer for your payment page UI. Coming next.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

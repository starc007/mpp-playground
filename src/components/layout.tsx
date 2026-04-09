"use client";

import type { Network } from "@/lib/types";
import { NetworkSelector } from "./network-selector";
import { WalletBar } from "./wallet-bar";

interface HeaderProps {
  network: Network;
  onNetworkChange: (network: Network) => void;
}

export function Header({ network, onNetworkChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border fixed top-0 left-0 right-0 bg-bg z-10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h1 className="text-sm font-semibold text-text tracking-wide uppercase">
          MPP Playground
        </h1>
        <NetworkSelector network={network} onChange={onNetworkChange} />
      </div>
      <WalletBar />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="px-6 py-3 border-t border-border">
      <div className="flex items-center justify-between text-xs text-text-dim">
        <span>
          built on{" "}
          <a
            href="https://mpp.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-primary transition-colors"
          >
            mpp.dev
          </a>
        </span>
        <span>
          powered by{" "}
          <a
            href="https://tempo.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-primary transition-colors"
          >
            Tempo
          </a>
        </span>
      </div>
    </footer>
  );
}

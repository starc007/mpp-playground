"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Search, Link2, Code2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetwork } from "./providers";
import { NetworkSelector } from "./network-selector";
import { WalletBar } from "./wallet-bar";

const NAV_ITEMS = [
  {
    href: "/",
    label: "MPP Inspector",
    icon: Search,
  },
  {
    href: "/payment-links",
    label: "Payment Links",
    icon: Link2,
  },
  {
    href: "/html",
    label: "HTML Builder",
    icon: Code2,
  },
  {
    href: "/scheduler",
    label: "TX Scheduler",
    icon: Clock,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { network, setNetwork } = useNetwork();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 flex-col border-r border-border bg-bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold tracking-wide uppercase">
          MPP Playground
        </span>
      </div>

      {/* Network */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">
          Network
        </div>
        <NetworkSelector network={network} onChange={setNetwork} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <Icon className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="border-t border-border p-4">
        <WalletBar />
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "MPP Inspector" },
  { href: "/payment-links", label: "Payment Links" },
  { href: "/html", label: "HTML Builder" },
] as const;

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-border -mt-4 pb-0">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "text-accent border-accent"
                : "text-text-muted border-transparent hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

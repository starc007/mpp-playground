"use client";

import { motion } from "motion/react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  description,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-60 min-h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 px-6 py-6 lg:px-10 lg:py-8 max-w-5xl w-full mx-auto space-y-8"
        >
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </header>

          {children}
        </motion.div>
      </main>
    </div>
  );
}

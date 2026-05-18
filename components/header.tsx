"use client";

import { History } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  onHistoryClick?: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/promazo-logo.png"
            alt="ProMazo"
            width={140}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline-block">
            AI-Powered Pipeline
          </span>
          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-accent/20 ring-2 ring-accent/40" />
        </div>
      </div>
    </header>
  );
}

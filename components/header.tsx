"use client";

import { History, Sparkles } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  onHistoryClick?: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              src="/promazo-icon.png"
              alt="ProMazo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <div className="absolute -inset-1 rounded-full bg-accent/20 blur-md -z-10" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              ProMazo
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground">Content Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent sm:inline-flex">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </span>
          <button
            onClick={onHistoryClick}
            className="btn-secondary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-accent to-teal-400">
            <div className="absolute inset-0.5 rounded-full bg-background" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-accent/20 to-teal-400/20" />
          </div>
        </div>
      </div>
    </header>
  );
}

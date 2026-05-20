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
          <div className="relative group">
            <Image
              src="/promazo-icon.png"
              alt="ProMazo"
              width={44}
              height={44}
              className="h-11 w-11 transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-accent/30 to-teal-400/30 blur-lg opacity-60 -z-10 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              ProMazo
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Content Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-accent/15 to-teal-400/15 px-4 py-2 text-xs font-bold text-accent ring-1 ring-accent/20 sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Pipeline
          </span>
          <button
            onClick={onHistoryClick}
            className="btn-secondary flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
}

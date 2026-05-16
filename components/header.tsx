"use client";

import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Zap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              ProMazo
            </h1>
            <p className="text-xs text-muted-foreground">Content Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline-block">
            AI-Powered Pipeline
          </span>
          <div className="h-8 w-8 rounded-full bg-accent/20 ring-2 ring-accent/40" />
        </div>
      </div>
    </header>
  );
}

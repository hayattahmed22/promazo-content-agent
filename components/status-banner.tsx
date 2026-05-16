"use client";

import { Loader2, AlertCircle } from "lucide-react";

interface StatusBannerProps {
  loading: boolean;
  vizardLoading: boolean;
  vizardStatus: string;
}

export function StatusBanner({
  loading,
  vizardLoading,
  vizardStatus,
}: StatusBannerProps) {
  if (!loading && !vizardLoading && !vizardStatus) return null;

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
          <div className="relative">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-accent/20" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              AI is analyzing your content
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a minute depending on content length...
            </p>
          </div>
        </div>
      )}

      {(vizardLoading || vizardStatus) && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
          {vizardLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          ) : (
            <AlertCircle className="h-5 w-5 text-accent" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              Vizard Processing
            </p>
            <p className="text-xs text-muted-foreground">{vizardStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
}

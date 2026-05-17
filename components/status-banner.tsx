"use client";

import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface StatusBannerProps {
  loading: boolean;
  vizardLoading: boolean;
  vizardStatus: string;
  errorMessage?: string;
}

export function StatusBanner({
  loading,
  vizardLoading,
  vizardStatus,
  errorMessage,
}: StatusBannerProps) {
  if (!loading && !vizardLoading && !vizardStatus && !errorMessage) return null;

  const isVizardDone =
    !vizardLoading && vizardStatus === "Vizard clips are ready.";

  return (
    <div className="flex flex-col gap-3">
      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-foreground">Error</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      )}

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
        <div
          className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
            isVizardDone
              ? "border-success/30 bg-success/5"
              : "border-accent/30 bg-accent/5"
          }`}
        >
          {vizardLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          ) : isVizardDone ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-accent" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isVizardDone ? "Clips Ready" : "Vizard Processing"}
            </p>
            <p className="text-xs text-muted-foreground">{vizardStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
}

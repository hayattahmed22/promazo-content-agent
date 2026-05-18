"use client";

import { Loader2, CheckCircle2, AlertCircle, XCircle, Upload, FileText, Zap, Captions, Film } from "lucide-react";

interface StatusBannerProps {
  loading: boolean;
  vizardLoading: boolean;
  vizardStatus: string;
  vizardProgress?: number;
  errorMessage?: string;
}

type ProcessingStage = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const PROCESSING_STAGES: ProcessingStage[] = [
  { id: "uploading", label: "Uploading video", icon: <Upload className="h-3.5 w-3.5" /> },
  { id: "transcribing", label: "Transcribing podcast", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "detecting", label: "Detecting viral moments", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "captions", label: "Generating captions", icon: <Captions className="h-3.5 w-3.5" /> },
  { id: "rendering", label: "Rendering shorts", icon: <Film className="h-3.5 w-3.5" /> },
];

function getActiveStageIndex(progress: number): number {
  if (progress < 15) return 0;
  if (progress < 35) return 1;
  if (progress < 55) return 2;
  if (progress < 75) return 3;
  return 4;
}

export function StatusBanner({
  loading,
  vizardLoading,
  vizardStatus,
  vizardProgress = 0,
  errorMessage,
}: StatusBannerProps) {
  if (!loading && !vizardLoading && !vizardStatus && !errorMessage) return null;

  const isVizardDone =
    !vizardLoading && vizardStatus === "Vizard clips are ready.";
  const isLoadedFromHistory = vizardStatus === "Loaded from history" || vizardStatus === "Clips loaded from Vizard";

  const activeStageIndex = vizardLoading ? getActiveStageIndex(vizardProgress) : -1;

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
          className={`rounded-xl border px-5 py-4 ${
            isVizardDone || isLoadedFromHistory
              ? "border-success/30 bg-success/5"
              : "border-accent/30 bg-accent/5"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            {vizardLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            ) : isVizardDone || isLoadedFromHistory ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-accent" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {isVizardDone || isLoadedFromHistory ? "Clips Ready" : "Vizard Processing"}
              </p>
              <p className="text-xs text-muted-foreground">{vizardStatus}</p>
            </div>
            {vizardLoading && vizardProgress > 0 && (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {vizardProgress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {vizardLoading && (
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${vizardProgress}%` }}
                />
              </div>

              {/* Processing stages */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {PROCESSING_STAGES.map((stage, index) => {
                  const isActive = index === activeStageIndex;
                  const isComplete = index < activeStageIndex;
                  
                  return (
                    <div
                      key={stage.id}
                      className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-all ${
                        isActive
                          ? "bg-accent/10"
                          : isComplete
                            ? "opacity-60"
                            : "opacity-30"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : isComplete
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isActive ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          stage.icon
                        )}
                      </div>
                      <span
                        className={`text-center text-[10px] leading-tight ${
                          isActive
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

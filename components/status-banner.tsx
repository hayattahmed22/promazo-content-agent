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
  { id: "uploading", label: "Upload", icon: <Upload className="h-3.5 w-3.5" /> },
  { id: "transcribing", label: "Transcribe", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "detecting", label: "Detect", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "captions", label: "Captions", icon: <Captions className="h-3.5 w-3.5" /> },
  { id: "rendering", label: "Render", icon: <Film className="h-3.5 w-3.5" /> },
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
        <div className="glass flex items-center gap-4 rounded-xl border-destructive/30 bg-destructive/5 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Error</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass flex items-center gap-4 rounded-xl border-accent/30 bg-accent/5 px-5 py-4 animate-pulse-glow">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
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
          className={`glass rounded-xl px-5 py-5 ${
            isVizardDone || isLoadedFromHistory
              ? "border-success/30 bg-success/5"
              : "border-accent/30 bg-accent/5"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isVizardDone || isLoadedFromHistory
                ? "bg-success/10"
                : "bg-accent/10"
            }`}>
              {vizardLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              ) : isVizardDone || isLoadedFromHistory ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {isVizardDone || isLoadedFromHistory ? "Clips Ready" : "Vizard Processing"}
              </p>
              <p className="text-xs text-muted-foreground">{vizardStatus}</p>
            </div>
            {vizardLoading && vizardProgress > 0 && (
              <span className="rounded-xl bg-accent/10 px-3 py-1.5 text-sm font-bold text-accent">
                {vizardProgress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {vizardLoading && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-teal-400 transition-all duration-500 ease-out shadow-lg shadow-accent/30"
                  style={{ width: `${vizardProgress}%` }}
                />
              </div>

              {/* Processing stages */}
              <div className="mt-4 flex justify-between gap-1">
                {PROCESSING_STAGES.map((stage, index) => {
                  const isActive = index === activeStageIndex;
                  const isComplete = index < activeStageIndex;
                  
                  return (
                    <div
                      key={stage.id}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-xl px-2 py-3 transition-all duration-300 ${
                        isActive
                          ? "bg-accent/10 scale-105"
                          : isComplete
                            ? "opacity-70"
                            : "opacity-30"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-accent text-white shadow-lg shadow-accent/30"
                            : isComplete
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          stage.icon
                        )}
                      </div>
                      <span
                        className={`text-center text-[10px] font-medium leading-tight ${
                          isActive
                            ? "text-foreground"
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

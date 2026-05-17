"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Video,
  ExternalLink,
  Trash2,
  Play,
} from "lucide-react";

export type HistoryClip = {
  title?: string;
  videoUrl?: string;
  viralScore?: number;
  duration?: number;
};

export type HistoryEntry = {
  id: string;
  videoLink: string;
  date: string;
  clips: HistoryClip[];
};

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onLoadEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  onLoadEntry,
  onDeleteEntry,
  onClearAll,
}: HistoryPanelProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + "...";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-hidden border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Generation History
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {history.length} previous generation
                    {history.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-140px)] overflow-y-auto px-6 py-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-foreground">
                    No history yet
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Your generated clips will appear here after Vizard processes
                    them successfully.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-accent/30"
                    >
                      {/* Date */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.date)}
                        </span>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Video link */}
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={entry.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-accent hover:underline"
                          title={entry.videoLink}
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {truncateUrl(entry.videoLink)}
                          </span>
                        </a>
                      </div>

                      {/* Clips summary */}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {entry.clips.length} clip
                          {entry.clips.length !== 1 ? "s" : ""} generated
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {entry.clips.slice(0, 3).map((clip, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent">
                                {i + 1}
                              </span>
                              <span className="truncate">
                                {clip.title || `Clip ${i + 1}`}
                              </span>
                              {clip.viralScore && (
                                <span className="ml-auto shrink-0 text-[10px] text-success">
                                  {clip.viralScore}%
                                </span>
                              )}
                            </div>
                          ))}
                          {entry.clips.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{entry.clips.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Load button */}
                      <button
                        onClick={() => onLoadEntry(entry)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:brightness-110"
                      >
                        <Play className="h-3.5 w-3.5" />
                        View Clips
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-6 py-4">
                <button
                  onClick={onClearAll}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

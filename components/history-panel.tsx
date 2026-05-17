"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Video,
  ExternalLink,
  Trash2,
  Play,
  RefreshCw,
  Search,
  Zap,
  Film,
  Loader2,
} from "lucide-react";

export type HistoryClip = {
  videoId?: number;
  title?: string;
  videoUrl?: string;
  viralScore?: number;
  duration?: number;
  transcript?: string;
  clipEditorUrl?: string;
};

export type HistoryEntry = {
  id: string;
  projectId?: string;
  videoLink: string;
  projectName?: string;
  date: string;
  clips: HistoryClip[];
  thumbnail?: string;
  status?: "ready" | "processing" | "error";
};

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onLoadEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onRefreshEntry?: (id: string) => Promise<void>;
}

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  onLoadEntry,
  onDeleteEntry,
  onClearAll,
  onRefreshEntry,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

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

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const truncateUrl = (url: string, maxLength: number = 35) => {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + "...";
  };

  const handleRefresh = async (id: string) => {
    if (!onRefreshEntry) return;
    setRefreshingId(id);
    await onRefreshEntry(id);
    setRefreshingId(null);
  };

  // Filter history based on search
  const filteredHistory = history.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.videoLink.toLowerCase().includes(query) ||
      entry.projectName?.toLowerCase().includes(query) ||
      entry.clips.some((c) => c.title?.toLowerCase().includes(query))
    );
  });

  // Get thumbnail from first clip
  const getThumbnail = (entry: HistoryEntry) => {
    if (entry.thumbnail) return entry.thumbnail;
    const firstClip = entry.clips[0];
    if (firstClip?.videoUrl) return firstClip.videoUrl;
    return null;
  };

  // Calculate total duration
  const getTotalDuration = (entry: HistoryEntry) => {
    const totalMs = entry.clips.reduce((sum, c) => sum + (c.duration || 0), 0);
    return totalMs > 0 ? formatDuration(totalMs * 1000) : null;
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Film className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Media Library
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {history.length} project{history.length !== 1 ? "s" : ""}{" "}
                      in workspace
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

              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-foreground">
                    {searchQuery ? "No matching projects" : "No projects yet"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term."
                      : "Your generated projects will appear here after Vizard processes them."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredHistory.map((entry) => {
                    const thumbnail = getThumbnail(entry);
                    const totalDuration = getTotalDuration(entry);
                    const isRefreshing = refreshingId === entry.id;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group overflow-hidden rounded-xl border border-border bg-muted/20 transition-all hover:border-accent/30 hover:bg-muted/40"
                      >
                        {/* Thumbnail / Preview */}
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          {thumbnail ? (
                            <video
                              src={thumbnail}
                              className="h-full w-full object-cover"
                              muted
                              preload="metadata"
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                          )}

                          {/* Overlay badges */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                              <Film className="h-3 w-3" />
                              {entry.clips.length} clip
                              {entry.clips.length !== 1 ? "s" : ""}
                            </span>
                            {totalDuration && (
                              <span className="flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                                <Clock className="h-3 w-3" />
                                {totalDuration}
                              </span>
                            )}
                          </div>

                          {/* Play overlay */}
                          <div
                            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-background/0 opacity-0 transition-all group-hover:bg-background/40 group-hover:opacity-100"
                            onClick={() => onLoadEntry(entry)}
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg">
                              <Play className="h-6 w-6 text-accent-foreground" />
                            </div>
                          </div>

                          {/* Refresh button */}
                          {onRefreshEntry && entry.projectId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefresh(entry.id);
                              }}
                              disabled={isRefreshing}
                              className="absolute right-2 top-2 rounded-lg bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                              title="Refresh from Vizard"
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          {/* Title & Date */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-foreground">
                                {entry.projectName ||
                                  entry.clips[0]?.title ||
                                  "Untitled Project"}
                              </h3>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(entry.date)}
                              </p>
                            </div>
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              className="shrink-0 rounded p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Source link */}
                          <a
                            href={entry.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline"
                            title={entry.videoLink}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {truncateUrl(entry.videoLink)}
                            </span>
                          </a>

                          {/* Clip previews */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {entry.clips.slice(0, 4).map((clip, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                              >
                                <span className="max-w-24 truncate text-muted-foreground">
                                  {clip.title || `Clip ${i + 1}`}
                                </span>
                                {clip.viralScore && (
                                  <span className="flex items-center gap-0.5 font-medium text-success">
                                    <Zap className="h-2.5 w-2.5" />
                                    {clip.viralScore}%
                                  </span>
                                )}
                              </div>
                            ))}
                            {entry.clips.length > 4 && (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                +{entry.clips.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => onLoadEntry(entry)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2 text-xs font-semibold text-accent-foreground transition-colors hover:brightness-110"
                            >
                              <Play className="h-3.5 w-3.5" />
                              View Clips
                            </button>
                            {entry.clips[0]?.clipEditorUrl && (
                              <a
                                href={entry.clips[0].clipEditorUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Edit in Vizard
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="shrink-0 border-t border-border bg-background px-6 py-4">
                <button
                  onClick={onClearAll}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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

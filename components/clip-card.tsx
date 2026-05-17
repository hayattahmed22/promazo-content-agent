"use client";

import {
  Check,
  Video,
  Copy,
  Hash,
  RefreshCw,
  Play,
  ExternalLink,
  Clock,
  Sparkles,
  MessageSquareQuote,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

type Clip = {
  title: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  snippet?: string;
  reason: string;
  caption: string;
  hashtags: string[];
  viralScore: number;
};

type VizardClip = {
  title?: string;
  videoUrl?: string;
  downloadUrl?: string;
  url?: string;
};

interface ClipCardProps {
  clip: Clip;
  index: number;
  vizardClip?: VizardClip;
  isApproved: boolean;
  vizardLoading: boolean;
  onApprove: () => void;
  onGenerateVideo: () => void;
  onCopyText: (text: string) => void;
}

function ViralScoreBadge({ score }: { score: number }) {
  let color = "bg-destructive/10 text-destructive border-destructive/20";
  if (score >= 80) {
    color = "bg-success/10 text-success border-success/20";
  } else if (score >= 60) {
    color = "bg-accent/10 text-accent border-accent/20";
  } else if (score >= 40) {
    color = "bg-warning/10 text-warning border-warning/20";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
    >
      <Sparkles className="h-3 w-3" />
      {score}% viral
    </span>
  );
}

export function ClipCard({
  clip,
  index,
  vizardClip,
  isApproved,
  vizardLoading,
  onApprove,
  onGenerateVideo,
  onCopyText,
}: ClipCardProps) {
  const vizardUrl =
    vizardClip?.videoUrl || vizardClip?.downloadUrl || vizardClip?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass group rounded-2xl p-6 transition-all hover:border-accent/30"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
            {index + 1}
          </span>
          <ViralScoreBadge score={clip.viralScore} />
        </div>
        <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          TikTok / Reels / Shorts
        </span>
      </div>

      {/* Video preview area */}
      {vizardUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-xl">
          <video
            src={vizardUrl}
            controls
            className="w-full rounded-xl"
          />
        </div>
      ) : (
        <div className="relative mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Play className="h-8 w-8" />
            <span className="text-xs">Video preview</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
        </div>
      )}

      {/* Title */}
      <h3 className="mt-4 text-balance text-lg font-semibold leading-snug text-foreground">
        {clip.title}
      </h3>

      {/* Timestamp */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {clip.timestamp}
      </div>

      {/* Transcript snippet */}
      {clip.snippet && (
        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Transcript Snippet
          </p>
          <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
            &quot;{clip.snippet}&quot;
          </p>
        </div>
      )}

      {/* Why AI selected */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Why AI selected this clip
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {clip.reason}
        </p>
      </div>

      {/* Generated hook */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Generated Hook / Caption
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          {clip.caption}
        </p>
      </div>

      {/* Hashtags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {clip.hashtags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            isApproved
              ? "bg-success text-accent-foreground"
              : "bg-foreground text-background hover:bg-foreground/90"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {isApproved ? "Approved" : "Approve"}
        </button>

        <button
          onClick={onGenerateVideo}
          disabled={vizardLoading}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {vizardLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Video className="h-3.5 w-3.5" />
          )}
          {vizardLoading ? "Generating..." : "Generate Real Short"}
        </button>

        {vizardUrl && (
          <a
            href={vizardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open / Download
          </a>
        )}

        <button className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </button>

        <button
          onClick={() => onCopyText(clip.caption)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Hook
        </button>

        <button
          onClick={() => onCopyText(clip.hashtags.join(" "))}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <Hash className="h-3.5 w-3.5" />
          Copy Hashtags
        </button>
      </div>
    </motion.div>
  );
}

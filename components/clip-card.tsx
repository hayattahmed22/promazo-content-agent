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
  Zap,
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
  let glowColor = "shadow-destructive/20";
  if (score >= 80) {
    color = "bg-success/10 text-success border-success/20";
    glowColor = "shadow-success/20";
  } else if (score >= 60) {
    color = "bg-accent/10 text-accent border-accent/20";
    glowColor = "shadow-accent/20";
  } else if (score >= 40) {
    color = "bg-warning/10 text-warning border-warning/20";
    glowColor = "shadow-warning/20";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm ${color} ${glowColor}`}
    >
      <Zap className="h-3 w-3" />
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
      className="glass card-premium group rounded-2xl p-6"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-teal-400 text-xs font-bold text-white shadow-lg shadow-accent/25">
            {index + 1}
          </span>
          <ViralScoreBadge score={clip.viralScore} />
        </div>
        <span className="whitespace-nowrap rounded-full bg-muted/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          TikTok / Reels / Shorts
        </span>
      </div>

      {/* Video preview area */}
      {vizardUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-xl shadow-lg shadow-black/20">
          <video
            src={vizardUrl}
            controls
            className="w-full rounded-xl"
          />
        </div>
      ) : (
        <div className="relative mt-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Play className="h-6 w-6 ml-0.5" />
            </div>
            <span className="text-xs font-medium">Video preview</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Title */}
      <h3 className="mt-5 text-balance text-lg font-bold leading-snug text-foreground">
        {clip.title}
      </h3>

      {/* Timestamp */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-medium">{clip.timestamp}</span>
      </div>

      {/* Transcript snippet */}
      {clip.snippet && (
        <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Why AI selected this clip
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {clip.reason}
        </p>
      </div>

      {/* Generated hook */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Generated Hook / Caption
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
          {clip.caption}
        </p>
      </div>

      {/* Hashtags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {clip.hashtags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          className={`group/btn flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-200 ${
            isApproved
              ? "bg-success text-white shadow-lg shadow-success/25"
              : "bg-foreground text-background hover:shadow-lg hover:shadow-foreground/10 hover:-translate-y-0.5"
          }`}
        >
          <Check className={`h-3.5 w-3.5 ${!isApproved && "transition-transform group-hover/btn:scale-110"}`} />
          {isApproved ? "Approved" : "Approve"}
        </button>

        <button
          onClick={onGenerateVideo}
          disabled={vizardLoading}
          className="btn-primary group/btn flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 disabled:transform-none"
        >
          {vizardLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Video className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
          )}
          {vizardLoading ? "Generating..." : "Generate Short"}
        </button>

        {vizardUrl && (
          <a
            href={vizardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Download
          </a>
        )}

        <button className="btn-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </button>

        <button
          onClick={() => onCopyText(clip.caption)}
          className="btn-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Hook
        </button>

        <button
          onClick={() => onCopyText(clip.hashtags.join(" "))}
          className="btn-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Hash className="h-3.5 w-3.5" />
          Hashtags
        </button>
      </div>
    </motion.div>
  );
}

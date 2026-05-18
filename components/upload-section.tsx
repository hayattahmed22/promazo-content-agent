"use client";

import { Upload, Link, Sparkles, Loader2, FileVideo, Mic, Wand2, Brain } from "lucide-react";
import { type ChangeEvent } from "react";

const AI_DIRECTION_PRESETS = [
  { emoji: "🎭", label: "Emotional stories", value: "Find emotional storytelling and deeply personal moments" },
  { emoji: "💰", label: "Money advice", value: "Focus on financial advice, money tips, and wealth-building insights" },
  { emoji: "🧠", label: "Technical insights", value: "Find technical insights, deep explanations, and educational content" },
  { emoji: "🔥", label: "Controversial takes", value: "Focus on controversial opinions, bold statements, and hot takes" },
  { emoji: "😂", label: "Funny moments", value: "Find the funniest and most entertaining moments" },
  { emoji: "📈", label: "Gen Z viral hooks", value: "Generate clips optimized for Gen Z viral content with strong hooks" },
  { emoji: "🎤", label: "Interviewee story", value: "Focus on the guest's personal stories and unique experiences" },
  { emoji: "🚀", label: "Startup advice", value: "Find startup and business advice for entrepreneurs" },
  { emoji: "❤️", label: "Life advice", value: "Find relatable life advice and wisdom" },
  { emoji: "🎬", label: "Cinematic moments", value: "Focus on cinematic storytelling and visually compelling moments" },
];

interface UploadSectionProps {
  file: File | null;
  fileName: string;
  videoLink: string;
  loading: boolean;
  vizardLoading: boolean;
  podcastMode: boolean;
  aiPrompt: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLinkChange: (value: string) => void;
  onPodcastModeChange: (enabled: boolean) => void;
  onAiPromptChange: (prompt: string) => void;
  onAnalyze: () => void;
}

export function UploadSection({
  file,
  fileName,
  videoLink,
  loading,
  vizardLoading,
  podcastMode,
  aiPrompt,
  onFileChange,
  onLinkChange,
  onPodcastModeChange,
  onAiPromptChange,
  onAnalyze,
}: UploadSectionProps) {
  const isProcessing = loading || vizardLoading;
  return (
    <section className="glass rounded-2xl p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">
          Upload or Analyze Podcast
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload an MP4 or paste a podcast/video link to generate AI-powered
          short-form content suggestions.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {/* File upload area */}
        <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 px-5 py-4 transition-colors hover:border-accent/50 hover:bg-muted">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {fileName || "Choose an MP4 file"}
            </p>
            <p className="text-xs text-muted-foreground">
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : "Drag and drop or click to browse"}
            </p>
          </div>
          {fileName && (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <FileVideo className="h-3.5 w-3.5" />
              Ready
            </div>
          )}
          <input
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={onFileChange}
          />
        </label>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* URL input */}
        <div className="relative">
          <Link className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="url"
            placeholder="Paste YouTube, Drive, or podcast link..."
            value={videoLink}
            onChange={(e) => onLinkChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-input py-3.5 pl-11 pr-4 text-sm text-foreground outline-none ring-ring transition-all placeholder:text-muted-foreground focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {videoLink && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-success">
            <Link className="h-3 w-3" />
            Video link added successfully
          </p>
        )}

        {/* AI Direction - Premium Feature */}
        <div className="group relative mt-4 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-background to-accent/10 p-5">
          {/* Animated glow effect */}
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Header */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 text-accent-foreground shadow-lg shadow-accent/25">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                What should the AI focus on?
              </h3>
              <p className="text-xs text-muted-foreground">
                Guide your AI content strategist toward the best moments
              </p>
            </div>
          </div>
          
          {/* Direction chips grid */}
          <div className="relative grid grid-cols-2 gap-2 mb-4">
            {AI_DIRECTION_PRESETS.map((preset) => {
              const isSelected = aiPrompt === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onAiPromptChange(isSelected ? "" : preset.value)}
                  className={`group/chip relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-accent text-accent-foreground shadow-md shadow-accent/30 scale-[1.02]"
                      : "bg-muted/60 text-foreground hover:bg-muted hover:shadow-sm hover:scale-[1.01]"
                  }`}
                >
                  <span className={`text-base transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover/chip:scale-110"}`}>
                    {preset.emoji}
                  </span>
                  <span className="truncate">{preset.label}</span>
                  {isSelected && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-foreground/20">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom direction input */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Wand2 className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Or type your own AI direction..."
              value={aiPrompt}
              onChange={(e) => onAiPromptChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-input/80 py-3 pl-10 pr-16 text-sm text-foreground outline-none ring-ring transition-all placeholder:text-muted-foreground focus:border-accent/50 focus:bg-input focus:ring-2 focus:ring-accent/20"
            />
            {aiPrompt && (
              <button
                type="button"
                onClick={() => onAiPromptChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Selected direction indicator */}
          {aiPrompt && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 text-accent shrink-0" />
              <p className="text-xs text-accent">
                <strong>AI Direction:</strong> {aiPrompt.length > 60 ? aiPrompt.substring(0, 60) + "..." : aiPrompt}
              </p>
            </div>
          )}
        </div>

        {/* Podcast Mode Toggle */}
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${podcastMode ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Podcast Mode</p>
              <p className="text-xs text-muted-foreground">
                Optimizes for long-form content (45+ min)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPodcastModeChange(!podcastMode)}
            className={`relative h-6 w-11 rounded-full transition-colors ${podcastMode ? "bg-accent" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${podcastMode ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {podcastMode && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
            <p className="text-xs text-accent">
              <strong>Podcast Mode enabled:</strong> AI will prioritize clips from the second half of your video where the best insights typically occur. Very high-scoring early clips are still included.
            </p>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={onAnalyze}
          disabled={isProcessing || (!file && !videoLink.trim())}
          className="mt-2 flex w-fit items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {vizardLoading ? "Processing with Vizard..." : "Analyzing..."}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate AI Clip Suggestions
            </>
          )}
        </button>
      </div>
    </section>
  );
}

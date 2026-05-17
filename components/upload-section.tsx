"use client";

import { Upload, Link, Sparkles, Loader2, FileVideo } from "lucide-react";
import { type ChangeEvent } from "react";

interface UploadSectionProps {
  file: File | null;
  fileName: string;
  videoLink: string;
  loading: boolean;
  vizardLoading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLinkChange: (value: string) => void;
  onAnalyze: () => void;
}

export function UploadSection({
  file,
  fileName,
  videoLink,
  loading,
  vizardLoading,
  onFileChange,
  onLinkChange,
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

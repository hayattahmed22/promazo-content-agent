"use client";

import { useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video, ChevronDown, Clock, Hash, MessageSquareQuote, Zap, Copy, Check } from "lucide-react";
import { Header } from "@/components/header";
import { UploadSection } from "@/components/upload-section";
import { StatusBanner } from "@/components/status-banner";
import { ClipCard } from "@/components/clip-card";

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
  duration?: number;
  viralScore?: number;
  startTime?: string;
  endTime?: string;
  transcript?: string;
  reason?: string;
  caption?: string;
  hashtags?: string[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [vizardLoading, setVizardLoading] = useState(false);
  const [vizardStatus, setVizardStatus] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [vizardClips, setVizardClips] = useState<VizardClip[]>([]);
  const [approvedClips, setApprovedClips] = useState<number[]>([]);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const [errorMessage, setErrorMessage] = useState("");

  // Check if a URL is a supported video link for Vizard
  const isVideoLink = (url: string) => {
    const supportedDomains = [
      "youtube.com",
      "youtu.be",
      "drive.google.com",
      "vimeo.com",
      "tiktok.com",
      "loom.com",
      "facebook.com",
      "fb.watch",
      "linkedin.com",
      "twitch.tv",
      ".mp4",
    ];
    return supportedDomains.some((domain) =>
      url.toLowerCase().includes(domain)
    );
  };

  const analyzeContent = async () => {
    if (!file && !videoLink.trim()) {
      alert("Please upload a video or paste a video link first.");
      return;
    }

    setErrorMessage("");
    setClips([]);
    setVizardClips([]);

    // If a video link is provided, route directly to Vizard
    if (videoLink.trim()) {
      console.log("[v0] Video link detected, routing to Vizard:", videoLink);
      await generateVideo(videoLink.trim());
      return;
    }

    // File upload: use /api/analyze for transcription + Claude analysis
    setLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);

      console.log("[v0] Uploading file for analysis:", file?.name);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("[v0] Analyze response:", data);

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to analyze content.");
        return;
      }

      setClips(data.clips || []);
    } catch (error) {
      console.error("[v0] Analyze error:", error);
      setErrorMessage("Failed to analyze content. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const findProjectId = (data: Record<string, unknown>) => {
    const d = data as Record<string, unknown>;
    const nested = (d.data ?? d.result ?? {}) as Record<string, unknown>;
    return (
      d.projectId ?? nested.projectId ?? d.project_id ?? nested.project_id
    );
  };

  const findVizardClips = (data: Record<string, unknown>) => {
    const d = data as Record<string, unknown>;
    const nested = (d.data ?? d.result ?? {}) as Record<string, unknown>;
    const rawClips: Record<string, unknown>[] =
      (d.videos as Record<string, unknown>[]) ??
      (d.clips as Record<string, unknown>[]) ??
      (nested.videos as Record<string, unknown>[]) ??
      (nested.clips as Record<string, unknown>[]) ??
      [];

    // Normalize Vizard API fields into our VizardClip shape
    const normalized: VizardClip[] = rawClips.map((c) => ({
      title: (c.title as string) || undefined,
      videoUrl: (c.videoUrl as string) || undefined,
      downloadUrl: (c.downloadUrl as string) || undefined,
      url: (c.url as string) || undefined,
      duration: c.videoMsDuration
        ? (c.videoMsDuration as number) / 1000
        : c.duration
          ? (c.duration as number)
          : undefined,
      viralScore: c.viralScore
        ? Math.round(parseFloat(String(c.viralScore)) * 10)
        : undefined,
      transcript: (c.transcript as string) || undefined,
      reason: (c.viralReason as string) || (c.reason as string) || undefined,
      caption: (c.caption as string) || undefined,
      hashtags: c.relatedTopic
        ? JSON.parse(String(c.relatedTopic))
        : c.hashtags
          ? (c.hashtags as string[])
          : undefined,
    }));

    // Filter out clips over 60 seconds, sort by viral score desc, take top 4
    return normalized
      .filter((c) => !c.duration || c.duration <= 60)
      .sort((a, b) => (b.viralScore ?? 0) - (a.viralScore ?? 0))
      .slice(0, 4);
  };

  const generateVideo = async (overrideUrl?: string) => {
    const urlToUse = overrideUrl || videoLink.trim();
    if (!urlToUse) {
      setErrorMessage("Paste a public video link first.");
      return;
    }

    setErrorMessage("");
    setVizardLoading(true);
    setVizardStatus("Submitting video to Vizard...");
    setVizardClips([]);

    try {
      console.log("[v0] Submitting to Vizard:", urlToUse);

      const submitResponse = await fetch("/api/vizard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: urlToUse,
        }),
      });

      const submitData = await submitResponse.json();
      console.log("[v0] Vizard submit response:", submitData);

      if (!submitResponse.ok) {
        const errorMsg = submitData.error || "Vizard submit failed.";
        console.error("[v0] Vizard error:", errorMsg);
        setErrorMessage(errorMsg);
        setVizardStatus("");
        setVizardLoading(false);
        return;
      }

      const projectId = findProjectId(submitData);
      console.log("[v0] Vizard projectId:", projectId);

      if (!projectId) {
        setErrorMessage(
          "Vizard submitted, but no projectId was found. Check console for full response."
        );
        setVizardStatus("");
        setVizardLoading(false);
        return;
      }

      setVizardStatus("Vizard is generating captioned short videos...");

      for (let i = 0; i < 30; i++) {
        setVizardStatus(`Checking Vizard progress... attempt ${i + 1}/30`);

        await new Promise((resolve) => setTimeout(resolve, 30000));

        console.log("[v0] Polling Vizard status, attempt", i + 1);

        const statusResponse = await fetch("/api/vizard/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId }),
        });

        const statusData = await statusResponse.json();
        console.log("[v0] Vizard status response:", statusData);

        const readyClips = findVizardClips(statusData);

        if (readyClips && readyClips.length > 0) {
          console.log("[v0] Vizard clips ready:", readyClips.length);
          setVizardClips(readyClips);
          setVizardStatus("Vizard clips are ready.");
          setVizardLoading(false);
          return;
        }
      }

      setVizardStatus("Still processing. Try again in a few minutes.");
      setVizardLoading(false);
    } catch (error) {
      console.error("[v0] Vizard error:", error);
      setErrorMessage(
        `Vizard failed: ${error instanceof Error ? error.message : "Unknown error"}. Check console.`
      );
      setVizardStatus("");
      setVizardLoading(false);
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setVideoLink("");
    }
  };

  const handleLinkChange = (value: string) => {
    setVideoLink(value);
    setFile(null);
    setFileName("");
  };

  // Only show top 3 clips sorted by viral score
  const topClips = [...clips]
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 3);

  // Vizard-only clips (Google Drive workflow): show when we have Vizard clips but no AI analysis clips
  const showVizardOnly = vizardClips.length > 0 && topClips.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Podcast to Viral Shorts
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            AI-powered workflow for turning long-form podcasts into short-form
            social content. Upload, analyze, and generate platform-ready clips
            in minutes.
          </p>
        </motion.div>

        {/* Upload section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <UploadSection
            file={file}
            fileName={fileName}
            videoLink={videoLink}
            loading={loading}
            vizardLoading={vizardLoading}
            onFileChange={handleFileChange}
            onLinkChange={handleLinkChange}
            onAnalyze={analyzeContent}
          />
        </motion.div>

        {/* Status banners */}
        <div className="mt-6">
          <StatusBanner
            loading={loading}
            vizardLoading={vizardLoading}
            vizardStatus={vizardStatus}
            errorMessage={errorMessage}
          />
        </div>

        {/* Clip results */}
        <AnimatePresence>
          {topClips.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Top AI Clip Suggestions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Showing the {topClips.length} highest-scoring moments from
                    your content
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {topClips.map((clip, index) => {
                  const originalIndex = clips.indexOf(clip);
                  const vizardClip = vizardClips[originalIndex];

                  return (
                    <ClipCard
                      key={originalIndex}
                      clip={clip}
                      index={index}
                      vizardClip={vizardClip}
                      isApproved={approvedClips.includes(originalIndex)}
                      vizardLoading={vizardLoading}
                      onApprove={() =>
                        setApprovedClips((prev) => [...prev, originalIndex])
                      }
                      onGenerateVideo={generateVideo}
                      onCopyText={copyText}
                    />
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Vizard-only results (Google Drive workflow) */}
        <AnimatePresence>
          {showVizardOnly && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Video className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Generated Short-Form Clips
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Top {vizardClips.length} clips under 60s generated from your
                    Google Drive video
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {vizardClips.map((vClip, index) => {
                  const vizardUrl =
                    vClip.videoUrl || vClip.downloadUrl || vClip.url;
                  const isExpanded = expandedCards.includes(index);

                  const toggleExpand = () => {
                    setExpandedCards((prev) =>
                      prev.includes(index)
                        ? prev.filter((i) => i !== index)
                        : [...prev, index]
                    );
                  };

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="glass group rounded-2xl p-5 transition-all hover:border-accent/30"
                    >
                      {/* Video preview */}
                      {vizardUrl ? (
                        <div className="relative overflow-hidden rounded-xl">
                          <video
                            src={vizardUrl}
                            controls
                            className="w-full rounded-xl"
                          />
                        </div>
                      ) : (
                        <div className="flex h-48 items-center justify-center rounded-xl bg-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Title + metadata row */}
                      <div className="mt-4 flex items-start justify-between gap-2">
                        <h3 className="text-balance text-base font-semibold leading-snug text-foreground">
                          {vClip.title || `Clip ${index + 1}`}
                        </h3>
                        {vClip.viralScore && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            <Zap className="h-3 w-3" />
                            {vClip.viralScore}%
                          </span>
                        )}
                      </div>

                      {/* Duration + timestamp */}
                      {(vClip.duration || vClip.startTime) && (
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          {vClip.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {Math.round(vClip.duration)}s
                            </span>
                          )}
                          {vClip.startTime && vClip.endTime && (
                            <span>
                              {vClip.startTime} &ndash; {vClip.endTime}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Show Analysis toggle */}
                      <button
                        onClick={toggleExpand}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                      >
                        <span>
                          {isExpanded ? "Hide Analysis" : "Show Analysis"}
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Expandable details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 flex flex-col gap-3">
                              {/* Viral Score */}
                              {vClip.viralScore && (
                                <div className="rounded-xl border border-border bg-muted/30 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Viral Score
                                  </p>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-accent transition-all"
                                        style={{
                                          width: `${vClip.viralScore}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">
                                      {vClip.viralScore}%
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Transcript snippet */}
                              {vClip.transcript && (
                                <div className="rounded-xl border border-border bg-muted/30 p-3">
                                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    <MessageSquareQuote className="h-3.5 w-3.5" />
                                    Transcript Snippet
                                  </p>
                                  <p className="mt-1.5 text-sm italic leading-relaxed text-muted-foreground">
                                    &quot;{vClip.transcript}&quot;
                                  </p>
                                </div>
                              )}

                              {/* Why AI selected */}
                              {vClip.reason && (
                                <div className="rounded-xl border border-border bg-muted/30 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Why AI Selected This
                                  </p>
                                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {vClip.reason}
                                  </p>
                                </div>
                              )}

                              {/* Generated hook/caption */}
                              {vClip.caption && (
                                <div className="rounded-xl border border-border bg-muted/30 p-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      Generated Hook / Caption
                                    </p>
                                    <button
                                      onClick={() =>
                                        copyText(vClip.caption || "")
                                      }
                                      className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                                      title="Copy caption"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                                    {vClip.caption}
                                  </p>
                                </div>
                              )}

                              {/* Hashtags */}
                              {vClip.hashtags && vClip.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {vClip.hashtags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                                    >
                                      <Hash className="h-3 w-3" />
                                      {tag.replace("#", "")}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setApprovedClips((prev) => [...prev, index])
                          }
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            approvedClips.includes(index)
                              ? "bg-success text-accent-foreground"
                              : "bg-foreground text-background hover:bg-foreground/90"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          {approvedClips.includes(index)
                            ? "Approved"
                            : "Approve"}
                        </button>

                        {vizardUrl && (
                          <a
                            href={vizardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs text-muted-foreground">
            ProMazo Content Agent &mdash; AI-powered content pipeline for modern
            creators
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video, Clock, Hash, MessageSquareQuote, Zap, Copy, Check } from "lucide-react";
import { Header } from "@/components/header";
import { UploadSection } from "@/components/upload-section";
import { StatusBanner } from "@/components/status-banner";
import { ClipCard } from "@/components/clip-card";
import { HistoryPanel, type HistoryEntry, type HistoryClip } from "@/components/history-panel";

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
  startTimeMs?: number;
  endTimeMs?: number;
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
  const [vizardProgress, setVizardProgress] = useState(0);
  const [clips, setClips] = useState<Clip[]>([]);
  const [vizardClips, setVizardClips] = useState<VizardClip[]>([]);
  const [approvedClips, setApprovedClips] = useState<number[]>([]);

  const [errorMessage, setErrorMessage] = useState("");

  // Podcast mode - bias toward later clips for long-form content
  const [podcastMode, setPodcastMode] = useState(false);
  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentVideoLink, setCurrentVideoLink] = useState("");

  // Load history from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem("promazo-history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      localStorage.removeItem("promazo-history");
    }
  }, []);

  // Save history to localStorage (using functional update to avoid stale closures)
  const saveHistory = (
    updater: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])
  ) => {
    if (typeof window === "undefined") return;
    
    setHistory((prev) => {
      const newHistory =
        typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("promazo-history", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save history:", error);
      }
      return newHistory;
    });
  };

  // Save a new entry to history (when project is first submitted)
  const saveProjectToHistory = (
    link: string,
    projectId: string,
    status: "processing" | "ready" | "error" = "processing"
  ) => {
    saveHistory((prev) => {
      // Check if project already exists
      const existing = prev.find((h) => h.projectId === projectId);
      if (existing) return prev; // Don't duplicate

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        projectId,
        videoLink: link,
        date: new Date().toISOString(),
        clips: [],
        status,
      };
      // Prepend new entry, keep max 20 entries
      return [newEntry, ...prev].slice(0, 20);
    });
  };

  // Update an existing history entry with clips (when processing completes)
  const updateHistoryWithClips = (
    projectId: string,
    clips: VizardClip[],
    projectName?: string
  ) => {
    saveHistory((prev) =>
      prev.map((h) =>
        h.projectId === projectId
          ? {
              ...h,
              projectName: projectName || h.projectName,
              status: "ready" as const,
              clips: clips.map((c) => ({
                title: c.title,
                videoUrl: c.videoUrl || c.downloadUrl || c.url,
                viralScore: c.viralScore,
                duration: c.duration,
              })),
            }
          : h
      )
    );
  };

  // Save a new entry to history (legacy - for backward compatibility)
  const saveToHistory = (
    link: string,
    clips: VizardClip[],
    projectId?: string,
    projectName?: string
  ) => {
    saveHistory((prev) => {
      if (projectId) {
        // If project already exists, just update it
        const existing = prev.find((h) => h.projectId === projectId);
        if (existing) {
          return prev.map((h) =>
            h.projectId === projectId
              ? {
                  ...h,
                  projectName: projectName || h.projectName,
                  status: "ready" as const,
                  clips: clips.map((c) => ({
                    title: c.title,
                    videoUrl: c.videoUrl || c.downloadUrl || c.url,
                    viralScore: c.viralScore,
                    duration: c.duration,
                  })),
                }
              : h
          );
        }
      }

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        projectId,
        projectName,
        videoLink: link,
        date: new Date().toISOString(),
        status: "ready",
        clips: clips.map((c) => ({
          title: c.title,
          videoUrl: c.videoUrl || c.downloadUrl || c.url,
          viralScore: c.viralScore,
          duration: c.duration,
        })),
      };
      // Prepend new entry, keep max 20 entries
      return [newEntry, ...prev].slice(0, 20);
    });
  };

  // Load a history entry (and auto-refresh if no clips)
  const loadHistoryEntry = async (entry: HistoryEntry) => {
    setHistoryOpen(false);
    setVideoLink(entry.videoLink);

    // If no clips and we have a projectId, fetch fresh data from Vizard
    if (entry.clips.length === 0 && entry.projectId) {
      setVizardLoading(true);
      setVizardStatus("Fetching clips from Vizard...");
      setVizardClips([]);

      try {
        const response = await fetch("/api/vizard/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: entry.projectId }),
        });

        const data = await response.json();

        if (data.code === 2000 && data.videos?.length > 0) {
          // Clips are ready - parse and display
          const freshClips: VizardClip[] = data.videos.map(
            (v: Record<string, unknown>) => ({
              title: v.title as string,
              videoUrl: v.videoUrl as string,
              viralScore: v.viralScore
                ? Math.round(parseFloat(String(v.viralScore)) * 10)
                : undefined,
              duration: v.videoMsDuration
                ? (v.videoMsDuration as number) / 1000
                : undefined,
            })
          );

          setVizardClips(freshClips);
          setVizardStatus("Clips loaded from Vizard");
          setVizardLoading(false);

          // Also update the history entry with the fresh clips
          saveHistory((prev) =>
            prev.map((h) =>
              h.id === entry.id
                ? {
                    ...h,
                    projectName: data.projectName || h.projectName,
                    status: "ready" as const,
                    clips: freshClips.map((c) => ({
                      title: c.title,
                      videoUrl: c.videoUrl,
                      viralScore: c.viralScore,
                      duration: c.duration,
                    })),
                  }
                : h
            )
          );
        } else if (data.code === 1000) {
          // Still processing
          setVizardStatus("Vizard is still processing this video. Try again later.");
          setVizardLoading(false);
        } else {
          setVizardStatus("Could not fetch clips. The project may have expired.");
          setVizardLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch clips:", error);
        setVizardStatus("Failed to fetch clips from Vizard.");
        setVizardLoading(false);
      }
    } else {
      // We have clips - just load them
      const loadedClips: VizardClip[] = entry.clips.map((c) => ({
        title: c.title,
        videoUrl: c.videoUrl,
        viralScore: c.viralScore,
        duration: c.duration,
      }));
      setVizardClips(loadedClips);
      setVizardStatus("Loaded from history");
    }
  };

  // Refresh a history entry from Vizard API
  const refreshHistoryEntry = async (id: string) => {
    // Get the entry from current state
    let entryProjectId: string | undefined;
    setHistory((prev) => {
      const entry = prev.find((h) => h.id === id);
      entryProjectId = entry?.projectId;
      return prev;
    });

    if (!entryProjectId) return;

    try {
      const response = await fetch("/api/vizard/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: entryProjectId }),
      });

      const data = await response.json();

      if (data.code === 2000 && data.videos?.length > 0) {
        // Update the history entry with fresh data - clips are ready
        const updatedClips = data.videos.map(
          (v: Record<string, unknown>) => ({
            title: v.title as string,
            videoUrl: v.videoUrl as string,
            viralScore: v.viralScore
              ? Math.round(parseFloat(String(v.viralScore)) * 10)
              : undefined,
            duration: v.videoMsDuration
              ? (v.videoMsDuration as number) / 1000
              : undefined,
            clipEditorUrl: v.clipEditorUrl as string,
          })
        );

        saveHistory((prev) =>
          prev.map((h) =>
            h.id === id
              ? {
                  ...h,
                  projectName: data.projectName || h.projectName,
                  status: "ready" as const,
                  clips: updatedClips,
                }
              : h
          )
        );
      } else if (data.code === 1000) {
        // Still processing - update status
        saveHistory((prev) =>
          prev.map((h) =>
            h.id === id ? { ...h, status: "processing" as const } : h
          )
        );
      } else if (data.code && data.code !== 2000 && data.code !== 1000) {
        // Error from Vizard
        saveHistory((prev) =>
          prev.map((h) =>
            h.id === id ? { ...h, status: "error" as const } : h
          )
        );
      }
    } catch (error) {
      console.error("Failed to refresh history entry:", error);
    }
  };

  // Import a Vizard project by ID
  const importVizardProject = async (projectId: string) => {
    // Check if already imported (using functional approach to read current state)
    let alreadyExists = false;
    setHistory((prev) => {
      alreadyExists = prev.some((h) => h.projectId === projectId);
      return prev;
    });

    if (alreadyExists) {
      throw new Error("This project is already in your library.");
    }

    // Fetch project details from Vizard
    const response = await fetch("/api/vizard/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });

    const data = await response.json();

    if (!response.ok || (data.code && data.code !== 2000 && data.code !== 1000)) {
      throw new Error(data.errMsg || "Failed to fetch project from Vizard.");
    }

    // Create history entry
    const clips =
      data.code === 2000 && data.videos?.length > 0
        ? data.videos.map((v: Record<string, unknown>) => ({
            title: v.title as string,
            videoUrl: v.videoUrl as string,
            viralScore: v.viralScore
              ? Math.round(parseFloat(String(v.viralScore)) * 10)
              : undefined,
            duration: v.videoMsDuration
              ? (v.videoMsDuration as number) / 1000
              : undefined,
            clipEditorUrl: v.clipEditorUrl as string,
          }))
        : [];

    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      projectId,
      projectName: data.projectName || "Imported Project",
      videoLink: data.videoUrl || "",
      date: new Date().toISOString(),
      status: data.code === 1000 ? "processing" : "ready",
      clips,
    };

    saveHistory((prev) => [newEntry, ...prev].slice(0, 20));
  };

  // Delete a history entry
  const deleteHistoryEntry = (id: string) => {
    saveHistory((prev) => prev.filter((h) => h.id !== id));
  };

  // Clear all history
  const clearHistory = () => {
    saveHistory([]);
  };

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
    
    // Check Vizard status code - 1000 means still processing
    if (d.code === 1000) {
      console.log("[v0] Vizard still processing (code 1000)");
      return [];
    }

    // videos array is at the top level in Vizard API response
    const rawClips: Record<string, unknown>[] =
      (d.videos as Record<string, unknown>[]) ?? [];

    console.log("[v0] Found", rawClips.length, "raw clips from Vizard");

    // Get total video duration for timeline percentage calculation
    const videoDurationMs = (d.videoDuration as number) ?? (d.videoMsDuration as number) ?? 0;

    // Normalize Vizard API fields into our VizardClip shape
    const normalized: VizardClip[] = rawClips.map((c) => {
      // Safely parse relatedTopic JSON
      let hashtags: string[] | undefined;
      try {
        if (c.relatedTopic && String(c.relatedTopic) !== "[]") {
          hashtags = JSON.parse(String(c.relatedTopic));
        }
      } catch {
        hashtags = undefined;
      }

      return {
        title: (c.title as string) || undefined,
        videoUrl: (c.videoUrl as string) || undefined,
        downloadUrl: (c.downloadUrl as string) || undefined,
        url: (c.url as string) || undefined,
        duration: c.videoMsDuration
          ? (c.videoMsDuration as number) / 1000
          : c.duration
            ? (c.duration as number)
            : undefined,
        // viralScore from Vizard is 0-10, multiply by 10 for percentage
        viralScore: c.viralScore
          ? Math.round(parseFloat(String(c.viralScore)) * 10)
          : undefined,
        startTimeMs: (c.startMsTime as number) ?? (c.startTimeMs as number) ?? undefined,
        endTimeMs: (c.endMsTime as number) ?? (c.endTimeMs as number) ?? undefined,
        transcript: (c.transcript as string) || undefined,
        reason: (c.viralReason as string) || (c.reason as string) || undefined,
        caption: (c.caption as string) || undefined,
        hashtags,
      };
    });

    // Podcast Mode: Bias toward later clips (last 50-60% of video)
    // Still allow early clips if they have very high viral scores (85%+)
    if (podcastMode && videoDurationMs > 0) {
      console.log("[v0] Podcast Mode enabled - weighting later clips");
      
      const scoredClips = normalized.map((clip) => {
        const startMs = clip.startTimeMs ?? 0;
        const timelinePosition = startMs / videoDurationMs; // 0.0 to 1.0
        const baseScore = clip.viralScore ?? 50;
        
        // Timeline weight: clips in second half get bonus
        // Position 0.0 (start) = 0.6x weight, Position 1.0 (end) = 1.4x weight
        // Linear interpolation: weight = 0.6 + (0.8 * position)
        const timelineWeight = 0.6 + (0.8 * timelinePosition);
        
        // Exception: Very high viral scores (85%+) from early content still rank well
        const isHighViral = baseScore >= 85;
        const effectiveWeight = isHighViral ? Math.max(timelineWeight, 1.0) : timelineWeight;
        
        const adjustedScore = Math.round(baseScore * effectiveWeight);
        
        return {
          ...clip,
          adjustedScore,
          timelinePosition,
        };
      });

      // Sort by adjusted score, take top 6 for podcasts (more variety)
      return scoredClips
        .sort((a, b) => b.adjustedScore - a.adjustedScore)
        .slice(0, 6)
        .map(({ adjustedScore, timelinePosition, ...clip }) => clip);
    }

    // Normal mode: Sort by viral score desc, take top 4
    return normalized
      .sort((a, b) => (b.viralScore ?? 0) - (a.viralScore ?? 0))
      .slice(0, 4);
  };

  const generateVideo = async (overrideUrl?: string) => {
    const urlToUse = overrideUrl || videoLink.trim();
    if (!urlToUse) {
      setErrorMessage("Paste a public video link first.");
      return;
    }

    // Track which URL we're processing for history
    setCurrentVideoLink(urlToUse);
    setErrorMessage("");
    setVizardLoading(true);
    setVizardProgress(0);
    setVizardStatus("Uploading video to Vizard...");
    setVizardClips([]);

    try {
      // Stage 1: Submit video
      setVizardProgress(5);

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

      if (!submitResponse.ok) {
        const errorMsg = submitData.error || "Vizard submit failed.";
        setErrorMessage(errorMsg);
        setVizardStatus("");
        setVizardLoading(false);
        setVizardProgress(0);
        return;
      }

      const projectId = findProjectId(submitData);

      if (!projectId) {
        setErrorMessage(
          "Vizard submitted, but no projectId was found. Check console for full response."
        );
        setVizardStatus("");
        setVizardLoading(false);
        setVizardProgress(0);
        return;
      }

      // Save to history immediately with "processing" status
      saveProjectToHistory(urlToUse, String(projectId), "processing");

      // Stage 2: Start polling with optimized intervals
      setVizardProgress(10);
      setVizardStatus("Transcribing your podcast...");

      // Polling configuration:
      // - First 5 polls: 10 seconds apart (50 sec total) - quick initial checks
      // - Next 10 polls: 15 seconds apart (150 sec total) - medium pace
      // - Remaining polls: 20 seconds apart - long content
      const MAX_POLLS = 40;
      let pollCount = 0;

      const getPollingInterval = (count: number): number => {
        if (count < 5) return 10000;  // 10 seconds
        if (count < 15) return 15000; // 15 seconds
        return 20000; // 20 seconds
      };

      // Progress stages based on poll count
      const getProgressAndStatus = (count: number): { progress: number; status: string } => {
        if (count < 3) return { progress: 15 + count * 5, status: "Transcribing your podcast..." };
        if (count < 6) return { progress: 30 + (count - 3) * 5, status: "Analyzing content for viral moments..." };
        if (count < 10) return { progress: 45 + (count - 6) * 5, status: "Detecting best clip opportunities..." };
        if (count < 15) return { progress: 65 + (count - 10) * 3, status: "Generating captions & hooks..." };
        if (count < 25) return { progress: 80 + (count - 15) * 1, status: "Rendering short-form videos..." };
        return { progress: 90 + Math.min(count - 25, 8), status: "Finalizing clips..." };
      };

      while (pollCount < MAX_POLLS) {
        const interval = getPollingInterval(pollCount);
        await new Promise((resolve) => setTimeout(resolve, interval));

        pollCount++;
        const { progress, status } = getProgressAndStatus(pollCount);
        setVizardProgress(progress);
        setVizardStatus(status);

        const statusResponse = await fetch("/api/vizard/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId }),
        });

        const statusData = await statusResponse.json();

        // Check for Vizard error codes
        if (statusData.code && statusData.code !== 2000 && statusData.code !== 1000) {
          setErrorMessage(`Vizard error (${statusData.code}): ${statusData.errMsg || "Unknown error"}`);
          setVizardStatus("");
          setVizardLoading(false);
          setVizardProgress(0);
          return;
        }

        const readyClips = findVizardClips(statusData);

        // STOP IMMEDIATELY when clips are ready
        if (readyClips && readyClips.length > 0) {
          setVizardProgress(100);
          setVizardClips(readyClips);
          setVizardStatus("Vizard clips are ready.");
          setVizardLoading(false);
          // Update the history entry with clips
          updateHistoryWithClips(
            String(projectId),
            readyClips,
            statusData.projectName
          );
          return; // Exit immediately
        }
      }

      // Timeout after all polls
      setErrorMessage(
        "Vizard is taking longer than expected. Your clips may still be processing - check History later."
      );
      setVizardStatus("");
      setVizardLoading(false);
      setVizardProgress(0);
    } catch (error) {
      console.error("Vizard generation error:", error);
      setErrorMessage("An error occurred during video generation.");
      setVizardStatus("");
      setVizardLoading(false);
      setVizardProgress(0);
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
      <Header onHistoryClick={() => setHistoryOpen(true)} />

      {/* History panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onLoadEntry={loadHistoryEntry}
        onDeleteEntry={deleteHistoryEntry}
        onClearAll={clearHistory}
        onRefreshEntry={refreshHistoryEntry}
        onImportProject={importVizardProject}
      />

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
            podcastMode={podcastMode}
            onFileChange={handleFileChange}
            onLinkChange={handleLinkChange}
            onPodcastModeChange={setPodcastMode}
            onAnalyze={analyzeContent}
          />
        </motion.div>

        {/* Status banners */}
        <div className="mt-6">
          <StatusBanner
            loading={loading}
            vizardLoading={vizardLoading}
            vizardStatus={vizardStatus}
            vizardProgress={vizardProgress}
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

        {/* Vizard-only results (Google Drive / direct link workflow) */}
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
                    Top {vizardClips.length} clips generated from your video
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {vizardClips.map((vClip, index) => {
                  const vizardUrl =
                    vClip.videoUrl || vClip.downloadUrl || vClip.url;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="glass group rounded-2xl p-6 transition-all hover:border-accent/30"
                    >
                      {/* Header row with viral score */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                            {index + 1}
                          </span>
                          {vClip.viralScore && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                              <Zap className="h-3 w-3" />
                              {vClip.viralScore}% viral
                            </span>
                          )}
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                          TikTok / Reels / Shorts
                        </span>
                      </div>

                      {/* Video preview */}
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
                            <Video className="h-8 w-8" />
                            <span className="text-xs">Video preview</span>
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="mt-4 text-balance text-lg font-semibold leading-snug text-foreground">
                        {vClip.title || `Clip ${index + 1}`}
                      </h3>

                      {/* Duration */}
                      {vClip.duration && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.round(vClip.duration)}s
                        </div>
                      )}

                      {/* Transcript snippet - always visible */}
                      {vClip.transcript && (
                        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <MessageSquareQuote className="h-3.5 w-3.5" />
                            Transcript Snippet
                          </p>
                          <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                            &quot;{vClip.transcript}&quot;
                          </p>
                        </div>
                      )}

                      {/* Why AI selected - always visible */}
                      {vClip.reason && (
                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Why AI selected this clip
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {vClip.reason}
                          </p>
                        </div>
                      )}

                      {/* Generated hook - always visible */}
                      {vClip.caption && (
                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Generated Hook / Caption
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                            {vClip.caption}
                          </p>
                        </div>
                      )}

                      {/* Hashtags - always visible */}
                      {vClip.hashtags && vClip.hashtags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {vClip.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                            >
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setApprovedClips((prev) => [...prev, index])
                          }
                          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            approvedClips.includes(index)
                              ? "bg-success text-accent-foreground"
                              : "bg-foreground text-background hover:bg-foreground/90"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {approvedClips.includes(index)
                            ? "Approved"
                            : "Approve"}
                        </button>

                        {vizardUrl && (
                          <a
                            href={vizardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
                          >
                            Download
                          </a>
                        )}

                        {vClip.caption && (
                          <button
                            onClick={() => copyText(vClip.caption || "")}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy Hook
                          </button>
                        )}

                        {vClip.hashtags && vClip.hashtags.length > 0 && (
                          <button
                            onClick={() =>
                              copyText(vClip.hashtags?.join(" ") || "")
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                          >
                            <Hash className="h-3.5 w-3.5" />
                            Copy Hashtags
                          </button>
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

"use client";

import { useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video } from "lucide-react";
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

  const analyzeContent = async () => {
    if (!file && !videoLink.trim()) {
      alert("Please upload a video or paste a video link first.");
      return;
    }

    setLoading(true);
    setClips([]);
    setVizardClips([]);

    try {
      const formData = new FormData();

      if (file) formData.append("file", file);
      formData.append("videoUrl", videoLink);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Analyze response:", data);

      // Google Drive links: automatically trigger Vizard pipeline
      if (data.source === "google_drive") {
        setLoading(false);
        await generateVideo(data.videoUrl);
        return;
      }

      setClips(data.clips || []);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze content.");
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
    return (
      (d.videos as VizardClip[]) ??
      (d.clips as VizardClip[]) ??
      (nested.videos as VizardClip[]) ??
      (nested.clips as VizardClip[]) ??
      []
    );
  };

  const generateVideo = async (overrideUrl?: string) => {
    const urlToUse = overrideUrl || videoLink.trim();
    if (!urlToUse) {
      alert("Paste a public YouTube, Drive, or podcast link first.");
      return;
    }

    const isDriveLink = urlToUse.includes("drive.google.com");

    setVizardLoading(true);
    setVizardStatus(
      isDriveLink
        ? "Processing Google Drive video with Vizard..."
        : "Submitting video to Vizard..."
    );
    setVizardClips([]);

    try {
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
      console.log("Vizard submit:", submitData);

      if (!submitResponse.ok) {
        alert(submitData.error || "Vizard submit failed.");
        setVizardLoading(false);
        return;
      }

      const projectId = findProjectId(submitData);

      if (!projectId) {
        alert("Vizard submitted, but no projectId was found. Check console.");
        setVizardLoading(false);
        return;
      }

      setVizardStatus("Vizard is generating captioned short videos...");

      for (let i = 0; i < 30; i++) {
        setVizardStatus(`Checking Vizard progress... attempt ${i + 1}/30`);

        await new Promise((resolve) => setTimeout(resolve, 30000));

        const statusResponse = await fetch("/api/vizard/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId }),
        });

        const statusData = await statusResponse.json();
        console.log("Vizard status:", statusData);

        const readyClips = findVizardClips(statusData);

        if (readyClips && readyClips.length > 0) {
          setVizardClips(readyClips.slice(0, 4));
          setVizardStatus("Vizard clips are ready.");
          setVizardLoading(false);
          return;
        }
      }

      setVizardStatus("Still processing. Try again in a few minutes.");
      setVizardLoading(false);
    } catch (error) {
      console.error(error);
      setVizardStatus("Vizard failed. Check terminal/console.");
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
                    Top {vizardClips.length} clips generated by Vizard from your
                    Google Drive video
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vizardClips.map((vClip, index) => {
                  const vizardUrl =
                    vClip.videoUrl || vClip.downloadUrl || vClip.url;

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

                      {/* Title */}
                      <h3 className="mt-4 text-balance text-base font-semibold leading-snug text-foreground">
                        {vClip.title || `Clip ${index + 1}`}
                      </h3>

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

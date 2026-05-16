"use client";

import { useState } from "react";

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

      setClips(data.clips || []);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze content.");
    } finally {
      setLoading(false);
    }
  };

  const findProjectId = (data: any) => {
    return (
      data.projectId ||
      data.data?.projectId ||
      data.result?.projectId ||
      data.project_id ||
      data.data?.project_id
    );
  };

  const findVizardClips = (data: any) => {
    return (
      data.videos ||
      data.clips ||
      data.data?.videos ||
      data.data?.clips ||
      data.result?.videos ||
      data.result?.clips ||
      []
    );
  };

  const generateVideo = async () => {
    if (!videoLink.trim()) {
      alert("Paste a public YouTube, Drive, or podcast link first.");
      return;
    }

    setVizardLoading(true);
    setVizardStatus("Submitting video to Vizard...");
    setVizardClips([]);

    try {
      const submitResponse = await fetch("/api/vizard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: videoLink,
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
    alert("Copied!");
  };

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-bold">ProMazo Content Agent</h1>

        <p className="mt-4 text-lg text-gray-400">
          AI-powered workflow for turning long-form podcasts into short-form social content.
        </p>

        <div className="mt-10 rounded-3xl border border-gray-800 bg-[#111111] p-8">
          <h2 className="text-2xl font-semibold">Upload or Analyze Podcast</h2>

          <p className="mt-2 text-gray-500">
            Upload an MP4 or paste a podcast/video link to generate AI-powered short-form content suggestions.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            <label className="w-fit cursor-pointer rounded-2xl bg-white px-6 py-3 font-semibold text-black">
              Upload MP4
              <input
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];

                  if (selectedFile) {
                    setFile(selectedFile);
                    setFileName(selectedFile.name);
                    setVideoLink("");
                  }
                }}
              />
            </label>

            <input
              type="url"
              placeholder="Paste YouTube, Drive, or podcast link..."
              value={videoLink}
              onChange={(e) => {
                setVideoLink(e.target.value);
                setFile(null);
                setFileName("");
              }}
              className="max-w-3xl rounded-2xl border border-gray-700 bg-[#1a1a1a] px-5 py-4 text-white outline-none"
            />

            <button
              onClick={analyzeContent}
              disabled={loading}
              className="w-fit rounded-2xl bg-blue-600 px-6 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Generate AI Clip Suggestions"}
            </button>
          </div>

          {fileName && (
            <p className="mt-5 text-green-400">Uploaded File: {fileName}</p>
          )}

          {videoLink && (
            <p className="mt-5 text-green-400">Video Link Added Successfully</p>
          )}

          {loading && (
            <div className="mt-8 rounded-2xl border border-yellow-700 bg-yellow-900/20 p-5">
              <p className="text-yellow-300">AI is analyzing the content...</p>
            </div>
          )}

          {(vizardLoading || vizardStatus) && (
            <div className="mt-8 rounded-2xl border border-blue-700 bg-blue-900/20 p-5">
              <p className="text-blue-300">{vizardStatus}</p>
            </div>
          )}
        </div>

        {clips.length > 0 && (
          <div className="mt-10">
            <h2 className="text-3xl font-bold">AI Generated Clip Suggestions</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {clips.map((clip, index) => {
                const vizardClip = vizardClips[index];
                const vizardUrl =
                  vizardClip?.videoUrl || vizardClip?.downloadUrl || vizardClip?.url;

                return (
                  <div
                    key={index}
                    className="rounded-3xl border border-gray-800 bg-[#111111] p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold">
                        Viral Potential: {clip.viralScore}%
                      </span>

                      <span className="text-sm text-gray-400">
                        TikTok • Reels • Shorts
                      </span>
                    </div>

                    {vizardUrl ? (
                      <div className="mt-5">
                        <video src={vizardUrl} controls className="w-full rounded-2xl" />
                      </div>
                    ) : (
                      <div className="mt-5 h-44 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900" />
                    )}

                    <h3 className="mt-5 text-2xl font-semibold">{clip.title}</h3>

                    <p className="mt-2 text-gray-400">Timestamp: {clip.timestamp}</p>

                    {clip.snippet && (
                      <div className="mt-5 rounded-2xl border border-gray-700 bg-[#181818] p-4">
                        <p className="text-sm font-semibold text-gray-300">
                          Transcript Snippet
                        </p>

                        <p className="mt-2 italic text-gray-400">
                          &quot;{clip.snippet}&quot;
                        </p>
                      </div>
                    )}

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-300">
                        Why AI selected this clip:
                      </p>

                      <p className="mt-2 text-gray-400">{clip.reason}</p>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-300">
                        Generated Hook
                      </p>

                      <p className="mt-2 text-gray-400">{clip.caption}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {clip.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-800 px-3 py-1 text-sm text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => setApprovedClips([...approvedClips, index])}
                        className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                      >
                        {approvedClips.includes(index) ? "Approved ✓" : "Approve"}
                      </button>

                      <button
                        onClick={generateVideo}
                        disabled={vizardLoading}
                        className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {vizardLoading ? "Generating..." : "Generate Real Short"}
                      </button>

                      {vizardUrl && (
                        <a
                          href={vizardUrl}
                          target="_blank"
                          className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                        >
                          Open / Download
                        </a>
                      )}

                      <button className="rounded-xl border border-gray-700 px-4 py-2 text-white">
                        Regenerate
                      </button>

                      <button
                        onClick={() => copyText(clip.caption)}
                        className="rounded-xl border border-gray-700 px-4 py-2 text-white"
                      >
                        Copy Hook
                      </button>

                      <button
                        onClick={() => copyText(clip.hashtags.join(" "))}
                        className="rounded-xl border border-gray-700 px-4 py-2 text-white"
                      >
                        Copy Hashtags
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
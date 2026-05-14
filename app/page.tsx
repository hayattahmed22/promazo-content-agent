"use client";

import { useState } from "react";

type Clip = {
  title: string;
  timestamp: string;
  reason: string;
  caption: string;
  hashtags: string[];
};

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);

  const analyzeContent = async () => {
    if (!fileName && !videoLink.trim()) {
      alert("Please upload a video or paste a video link first.");
      return;
    }

    setLoading(true);
    setClips([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          fileName,
          videoUrl: videoLink,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setClips(data.clips || []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-bold">ProMazo Content Agent</h1>

        <p className="mt-4 text-lg text-gray-400">
          AI-powered workflow for turning long-form podcasts into short-form
          social content.
        </p>

        <div className="mt-10 rounded-3xl border border-gray-800 bg-[#111111] p-8">
          <h2 className="text-2xl font-semibold">
            Upload or Analyze Podcast
          </h2>

          <p className="mt-2 text-gray-500">
            Upload an MP4 or paste a podcast/video link to generate AI-powered
            short-form content suggestions.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            <label className="w-fit cursor-pointer rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:opacity-90">
              Upload MP4
              <input
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setFileName(file.name);
                    setVideoLink("");
                  }
                }}
              />
            </label>

            <input
              type="url"
              placeholder="Paste YouTube or podcast link..."
              value={videoLink}
              onChange={(e) => {
                setVideoLink(e.target.value);
                setFileName("");
              }}
              className="max-w-3xl rounded-2xl border border-gray-700 bg-[#1a1a1a] px-5 py-4 text-white outline-none"
            />

            <button
              onClick={analyzeContent}
              className="w-fit rounded-2xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
            >
              Generate AI Clip Suggestions
            </button>
          </div>

          {fileName && (
            <p className="mt-5 text-green-400">
              Uploaded File: {fileName}
            </p>
          )}

          {videoLink && (
            <p className="mt-5 text-green-400">
              Video Link Added Successfully
            </p>
          )}

          {loading && (
            <div className="mt-8 rounded-2xl border border-yellow-700 bg-yellow-900/20 p-5">
              <p className="text-yellow-300">
                AI workflow is analyzing video, detecting key moments,
                generating captions, and scoring clip performance...
              </p>
            </div>
          )}
        </div>

        {clips.length > 0 && (
          <div className="mt-10">
            <h2 className="text-3xl font-bold">
              AI Generated Clip Suggestions
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {clips.map((clip, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-gray-800 bg-[#111111] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold">
                      Viral Potential: 92%
                    </span>

                    <span className="text-sm text-gray-400">
                      TikTok • Reels • Shorts
                    </span>
                  </div>

                  <div className="mt-5 h-44 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900" />

                  <h3 className="mt-5 text-2xl font-semibold">
                    {clip.title}
                  </h3>

                  <p className="mt-2 text-gray-400">
                    Timestamp: {clip.timestamp}
                  </p>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-gray-300">
                      Why AI selected this clip:
                    </p>

                    <p className="mt-2 text-gray-400">
                      {clip.reason}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-gray-300">
                      Generated Caption
                    </p>

                    <p className="mt-2 text-gray-400">
                      {clip.caption}
                    </p>
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

                  <div className="mt-6 flex gap-3">
                    <button className="rounded-xl bg-white px-4 py-2 font-semibold text-black">
                      Approve
                    </button>

                    <button className="rounded-xl border border-gray-700 px-4 py-2 text-white">
                      Regenerate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
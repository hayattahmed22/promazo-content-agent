import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const assemblyHeaders = {
  authorization: process.env.ASSEMBLYAI_API_KEY || "",
};

async function uploadToAssemblyAI(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath);

  const response = await fetch(
    "https://api.assemblyai.com/v2/upload",
    {
      method: "POST",
      headers: assemblyHeaders,
      body: fileBuffer,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AssemblyAI upload failed");
  }

  return data.upload_url;
}

async function transcribeWithAssemblyAI(
  audioUrl: string
) {
  const transcriptResponse = await fetch(
    "https://api.assemblyai.com/v2/transcript",
    {
      method: "POST",
      headers: {
        ...assemblyHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
      }),
    }
  );

  const transcriptData = await transcriptResponse.json();

  if (!transcriptResponse.ok) {
    throw new Error(
      transcriptData.error ||
        "AssemblyAI transcription failed"
    );
  }

  const transcriptId = transcriptData.id;

  for (let i = 0; i < 40; i++) {
    const pollingResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: assemblyHeaders,
      }
    );

    const pollingData = await pollingResponse.json();

    if (pollingData.status === "completed") {
      return pollingData.text;
    }

    if (pollingData.status === "error") {
      throw new Error(
        pollingData.error || "Transcription failed"
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 3000)
    );
  }

  throw new Error("Transcription timed out");
}

async function generateClipsWithClaude(
  transcript: string
) {
  const prompt = `
You are an expert AI content strategist for TikTok, Reels, and YouTube Shorts.

Analyze this transcript and identify the 3 BEST short-form moments.

Return ONLY valid JSON:

{
  "clips": [
    {
      "title": "",
      "timestamp": "",
      "startTime": "",
      "endTime": "",
      "snippet": "",
      "reason": "",
      "caption": "",
      "hashtags": ["", "", ""],
      "viralScore": 0
    }
  ]
}

Rules:
- Titles should feel viral.
- Caption must be ONE short hook sentence.
- startTime and endTime must be HH:MM:SS.
- Clip length: 20-60 seconds.
- Use different viral scores.

Transcript:
${transcript.slice(0, 12000)}
`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = message.content.find(
    (block) => block.type === "text"
  );

  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text.");
  }

  const cleaned = textBlock.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const videoUrl = formData.get("videoUrl") as
      | string
      | null;

    if (!file && !videoUrl) {
      return NextResponse.json(
        {
          error:
            "Please upload a video or paste a video link.",
        },
        { status: 400 }
      );
    }

    // MP4 Upload
    if (file) {
      const uploadsDir = path.join(
        process.cwd(),
        "uploads"
      );

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filePath = path.join(
        uploadsDir,
        file.name
      );

      fs.writeFileSync(filePath, buffer);

      const uploadUrl =
        await uploadToAssemblyAI(filePath);

      const transcript =
        await transcribeWithAssemblyAI(uploadUrl);

      const result =
        await generateClipsWithClaude(transcript);

      result.clips = result.clips.map(
        (clip: any) => ({
          ...clip,
          inputVideo: filePath,
        })
      );

      return NextResponse.json(result);
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          error: "Video URL required.",
        },
        { status: 400 }
      );
    }

    // Google Drive: signal frontend to use Vizard pipeline
    if (
      videoUrl.includes("drive.google.com")
    ) {
      return NextResponse.json({
        source: "google_drive",
        videoUrl,
        clips: [],
      });
    }

    // YouTube Workflow
    if (
      videoUrl.includes("youtube.com") ||
      videoUrl.includes("youtu.be")
    ) {
      const transcriptItems =
        await YoutubeTranscript.fetchTranscript(
          videoUrl
        );

      const transcript = transcriptItems
        .map(
          (item) =>
            `[${Math.floor(
              item.offset / 1000
            )}s] ${item.text}`
        )
        .join("\n");

      const result =
        await generateClipsWithClaude(transcript);

      result.clips = result.clips.map(
        (clip: any) => ({
          ...clip,
          inputVideo: videoUrl,
        })
      );

      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        error:
          "Unsupported link type. Use YouTube, Google Drive, or MP4 upload.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not analyze this video.",
      },
      { status: 500 }
    );
  }
}

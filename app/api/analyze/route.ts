import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;

    if (!file && !videoUrl) {
      return NextResponse.json(
        { error: "Please upload a video or paste a video link." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key is missing. Check .env.local." },
        { status: 500 }
      );
    }

    if (file) {
      const uploadsDir = path.join(process.cwd(), "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filePath = path.join(uploadsDir, file.name);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        clips: [
          {
            title: "Uploaded MP4 received",
            timestamp: "Needs transcription integration",
            snippet: "The uploaded video was saved successfully.",
            reason:
              "The MP4 upload is now working. Next step is connecting Whisper/AssemblyAI to transcribe the uploaded video before Claude analyzes it.",
            caption:
              "This uploaded podcast is ready for transcription and short-form clip generation.",
            hashtags: ["#AIWorkflow", "#PodcastClips", "#ContentAgent"],
            viralScore: 80,
          },
        ],
      });
    }

    if (!videoUrl) {
  return NextResponse.json(
    { error: "Video URL is required." },
    { status: 400 }
  );
}

const transcriptItems = await YoutubeTranscript.fetchTranscript(videoUrl);

    const transcript = transcriptItems
      .map((item) => `[${Math.floor(item.offset / 1000)}s] ${item.text}`)
      .join("\n");

    const prompt = `
You are an expert AI content strategist for TikTok, Reels, and YouTube Shorts.

Analyze this podcast transcript and identify the 3 BEST short-form moments.

Return ONLY valid JSON in this exact format:

{
  "clips": [
    {
      "title": "",
      "timestamp": "",
      "snippet": "",
      "reason": "",
      "caption": "One short viral hook sentence only",
      "hashtags": ["", "", ""],
      "viralScore": 0
    }
  ]
}

Rules:
- Pick emotionally engaging, insightful, controversial, surprising, or highly actionable moments.
- The snippet must be a REAL quote from the transcript.
- Titles should feel like viral hooks.
- Caption must be ONLY ONE short punchy sentence.
- Caption should feel like a viral hook for TikTok/Reels/Shorts.
- Do NOT make captions longer than 15 words.
- Make captions emotionally engaging and curiosity-driven.
- Do not invent information outside the transcript.

Viral score instructions:
Score each clip from 1 to 100 based on:
- Hook strength
- Clarity
- Emotional impact
- Practical value
- Shareability
- Short-form fit

Use different scores for each clip.
Only give scores above 90 if the moment is genuinely very strong.

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

    const textBlock = message.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude did not return text.");
    }

    const cleaned = textBlock.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not analyze this video. Try a YouTube link with captions, or upload an MP4.",
      },
      { status: 500 }
    );
  }
}
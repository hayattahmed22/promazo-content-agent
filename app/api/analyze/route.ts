import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, fileName } = body;

    if (!videoUrl && !fileName) {
      return NextResponse.json(
        { error: "Please provide a video link or upload." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key is missing. Check .env.local." },
        { status: 500 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json({
        clips: [
          {
            title: "MP4 upload detected",
            timestamp: "Needs transcription integration",
            snippet: "Uploaded MP4 received successfully.",
            reason:
              "MP4 upload is working, but we still need a transcription API to analyze uploaded videos.",
            caption: "MP4 upload workflow is ready for transcription.",
            hashtags: ["#AIWorkflow", "#PodcastClips"],
            viralScore: 80,
          },
        ],
      });
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
      "caption": "",
      "hashtags": ["", "", ""],
      "viralScore": 0
    }
  ]
}

Rules:
- Pick emotionally engaging, insightful, controversial, surprising, or highly actionable moments.
- The snippet must be a REAL quote from the transcript.
- Titles should feel like viral hooks.
- Caption should sound natural for TikTok/Reels.
- Do not invent information outside the transcript.

Viral score instructions:
Score each clip from 1 to 100 based on:
- Hook strength: does it grab attention quickly?
- Clarity: can someone understand it without watching the full podcast?
- Emotional impact: does it feel surprising, inspiring, funny, intense, or relatable?
- Practical value: does the viewer learn something useful?
- Shareability: would someone repost/save/send it?
- Short-form fit: does it work well as a 30–60 second TikTok/Reel/Short?

Use different scores for each clip. Do not give every clip the same score.
Only give high scores above 90 if the moment is genuinely very strong.

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
          "Could not analyze this video. Make sure it is a YouTube link with captions available, or use MP4 upload for placeholder mode.",
      },
      { status: 500 }
    );
  }
}
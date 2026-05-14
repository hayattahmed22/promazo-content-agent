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
            reason:
              "MP4 upload is working, but we still need a transcription API to analyze uploaded videos.",
            caption: "MP4 upload workflow is ready for transcription.",
            hashtags: ["#AIWorkflow", "#PodcastClips"],
          },
        ],
      });
    }

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoUrl);

    const transcript = transcriptItems
      .map((item) => `[${Math.floor(item.offset / 1000)}s] ${item.text}`)
      .join("\n");

    const prompt = `
Analyze this transcript and generate 3 short-form clip suggestions.

Return ONLY valid JSON exactly like this:
{
  "clips": [
    {
      "title": "",
      "timestamp": "",
      "reason": "",
      "caption": "",
      "hashtags": ["", ""]
    }
  ]
}

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
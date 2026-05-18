import { NextRequest, NextResponse } from "next/server";

function getVideoType(url: string): number {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return 2;
  if (url.includes("drive.google.com")) return 3;
  if (url.includes("vimeo.com")) return 4;
  if (url.includes("streamyard.com")) return 5;
  if (url.includes("tiktok.com")) return 6;
  if (url.includes("twitter.com") || url.includes("x.com")) return 7;
  if (url.includes("twitch.tv")) return 9;
  if (url.includes("loom.com")) return 10;
  if (url.includes("facebook.com") || url.includes("fb.watch")) return 11;
  if (url.includes("linkedin.com")) return 12;
  return 1;
}

function getFileExt(url: string): string | undefined {
  const match = url.match(/\.(mp4|mov|avi|3gp)(\?|$)/i);
  return match ? match[1].toLowerCase() : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, lang = "en" } = await req.json();

    console.log("[vizard] submit request:", { videoUrl, lang });

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
    }

    if (!process.env.VIZARD_API_KEY) {
      return NextResponse.json({ error: "Vizard API key missing." }, { status: 500 });
    }

    const videoType = getVideoType(videoUrl);
    const ext = videoType === 1 ? getFileExt(videoUrl) : undefined;

    console.log("[vizard] detected videoType:", videoType);

    const response = await fetch(
      "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          VIZARDAI_API_KEY: process.env.VIZARD_API_KEY,
        },
        body: JSON.stringify({
          videoUrl,
          videoType,
          lang,
          ...(ext ? { ext } : {}),
          // auto length — lets Vizard pick the best clip duration per moment
          preferLength: [0],
          // burn subtitles/captions onto the video
          subtitleSwitch: 1,
          // add emoji to subtitle text for engagement
          emojiSwitch: 1,
          // overlay AI-generated hook headline at the start of each clip
          headlineSwitch: 1,
        }),
      }
    );

    const data = await response.json();
    console.log("[vizard] create response:", JSON.stringify(data, null, 2));

    if (!response.ok || (data.code && data.code !== 2000)) {
      console.error("[vizard] create failed:", data);

      // 4007 = out of Vizard credits/time — flag so the front-end can fall back
      if (data.code === 4007) {
        return NextResponse.json(
          {
            error:
              "Vizard credits are used up. Falling back to AI clip suggestions (timestamps + hooks only — no rendered video).",
            outOfCredits: true,
            code: 4007,
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: data.errMsg || "Vizard submit failed", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[vizard] submit error:", error);
    return NextResponse.json({ error: "Could not submit video to Vizard." }, { status: 500 });
  }
}

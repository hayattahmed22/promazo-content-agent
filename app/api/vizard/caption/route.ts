import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { videoId, platform = 2, tone = 2, voice = 0 } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required." }, { status: 400 });
    }

    if (!process.env.VIZARD_API_KEY) {
      return NextResponse.json({ error: "Vizard API key missing." }, { status: 500 });
    }

    const response = await fetch(
      "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/ai-social",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          VIZARDAI_API_KEY: process.env.VIZARD_API_KEY,
        },
        body: JSON.stringify({
          finalVideoId: videoId,
          // platform: 1=General,2=TikTok,3=Instagram,4=YouTube,5=Facebook,6=LinkedIn,7=Twitter
          aiSocialPlatform: platform,
          // tone: 0=Neutral,1=Interesting,2=Catchy,3=Serious,4=Question
          tone,
          // voice: 0=First person,1=Third person
          voice,
        }),
      }
    );

    const data = await response.json();
    console.log("[vizard/caption] response:", JSON.stringify(data, null, 2));

    if (data.code !== 2000) {
      return NextResponse.json(
        { error: data.errMsg || "Caption generation failed", code: data.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      caption: data.aiSocialContent,
      youtubeTitle: data.aiSocialTitle,
    });
  } catch (error) {
    console.error("[vizard/caption] error:", error);
    return NextResponse.json({ error: "Could not generate caption." }, { status: 500 });
  }
}

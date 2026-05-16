import { NextRequest, NextResponse } from "next/server";

function getVideoType(url: string) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return 2;
  if (url.includes("drive.google.com")) return 3;
  if (url.includes("vimeo.com")) return 4;
  if (url.includes("streamyard.com")) return 5;
  return 1;
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
    }

    if (!process.env.VIZARD_API_KEY) {
      return NextResponse.json({ error: "Vizard API key missing." }, { status: 500 });
    }

    const response = await fetch(
      "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          VIZARDAI_API_KEY: process.env.VIZARD_API_KEY,
        },
        body: JSON.stringify({
          lang: "en",
          preferLength: [0],
          videoUrl,
          videoType: getVideoType(videoUrl),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Vizard submit failed", details: data }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not submit video to Vizard." }, { status: 500 });
  }
}
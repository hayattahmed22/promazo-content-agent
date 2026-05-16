import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

function timeToSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputVideo, start, end } = body;

    if (!inputVideo || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const clipsDir = path.join(process.cwd(), "clips");

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir);
    }

    const outputPath = path.join(clipsDir, `clip-${Date.now()}.mp4`);

    const startSeconds = timeToSeconds(start);
    const endSeconds = timeToSeconds(end);
    const duration = endSeconds - startSeconds;

    await new Promise((resolve, reject) => {
      ffmpeg(inputVideo)
        .setStartTime(startSeconds)
        .setDuration(duration)
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    return NextResponse.json({
      success: true,
      output: outputPath,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Clip generation failed" },
      { status: 500 }
    );
  }
}
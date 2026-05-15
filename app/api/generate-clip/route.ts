import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      inputVideo,
      start,
      duration,
    } = body;

    const uploadsDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const outputPath = path.join(
      uploadsDir,
      `clip-${Date.now()}.mp4`
    );

    await new Promise((resolve, reject) => {
      ffmpeg(inputVideo)
        .setStartTime(start)
        .setDuration(duration)
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    return NextResponse.json({
      success: true,
      clipUrl: outputPath,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Clip generation failed",
      },
      { status: 500 }
    );
  }
}
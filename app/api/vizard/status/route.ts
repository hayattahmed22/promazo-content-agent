import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    console.log("[v0] Vizard status check for projectId:", projectId);

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const response = await fetch(
      `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${projectId}`,
      {
        method: "GET",
        headers: {
          VIZARDAI_API_KEY: process.env.VIZARD_API_KEY || "",
        },
      }
    );

    const data = await response.json();
    console.log("[v0] Vizard status response:", JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Vizard status error:", error);
    return NextResponse.json({ error: "Could not check Vizard status." }, { status: 500 });
  }
}

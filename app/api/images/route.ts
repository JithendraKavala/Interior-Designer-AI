import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/images - Save image URL to history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, imageUrl } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { error: "userId and imageUrl are required" },
        { status: 400 }
      );
    }

    const imageHistory = await prisma.imageHistory.create({
      data: {
        userId,
        imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: imageHistory,
    });
  } catch (error) {
    console.error("Error saving image to history:", error);
    return NextResponse.json(
      { error: "Failed to save image to history" },
      { status: 500 }
    );
  }
}

// GET /api/images?userId=... - Get all images for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const images = await prisma.imageHistory.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching image history:", error);
    return NextResponse.json(
      { error: "Failed to fetch image history" },
      { status: 500 }
    );
  }
}


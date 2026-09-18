import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const campaigns = await prisma.campaigns.findMany({
      take: 5,
    });

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
      },
      {
        status: 500,
      }
    );
  }
}
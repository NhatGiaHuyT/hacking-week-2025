import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: {
            timestamp: "asc",
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: "Chat session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: chatSession });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, senderId, senderType, content, type } = body;

    if (!sessionId || !senderId || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate sender permissions
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Check if sender is authorized (customer or assigned agent)
    const isAuthorized =
      (senderType === "customer" && chatSession.customerId === senderId) ||
      (senderType === "agent" && chatSession.agentId === senderId) ||
      session.user.role === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to send messages in this session" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderId,
        senderType,
        content,
        type: type || "text",
        read: false,
      },
    });

    // Update the chat session
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create chat message" },
      { status: 500 }
    );
  }
}

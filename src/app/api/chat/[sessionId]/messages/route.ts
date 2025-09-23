import { NextRequest, NextResponse } from 'next/server';
import { db, ChatMessage } from '@/lib/database';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// GET /api/chat/[sessionId]/messages - Get messages for a chat session
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const sessionId = params.sessionId;
    const session = await db.getChatSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session.messages,
      count: session.messages.length
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/[sessionId]/messages - Send a message in a chat session
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const sessionId = params.sessionId;
    const body = await request.json();

    const messageData = {
      sessionId,
      senderId: body.senderId,
      senderType: body.senderType, // 'customer' | 'agent' | 'system'
      content: body.content,
      type: body.type || 'text',
      metadata: body.metadata || {},
      read: false
    };

    const message = await db.addChatMessage(messageData);

    // Update session status
    const session = await db.getChatSession(sessionId);
    if (session) {
      session.updatedAt = new Date();
      if (message.senderType === 'customer') {
        session.status = 'waiting';
      } else if (message.senderType === 'agent') {
        session.status = 'active';
      }
    }

    return NextResponse.json({
      success: true,
      data: message
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

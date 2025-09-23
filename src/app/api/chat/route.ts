import { NextRequest, NextResponse } from 'next/server';
import { db, ChatSession, ChatMessage } from '@/lib/database';

// GET /api/chat - Get all chat sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const agentId = searchParams.get('agentId');

    // In a real implementation, you'd fetch from database
    // For now, return mock data
    const sessions: ChatSession[] = [];

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sessionData = {
      customerId: body.customerId,
      agentId: body.agentId,
      status: body.status || 'active',
      priority: body.priority || 'medium'
    };

    const session = await db.createChatSession(sessionData);

    return NextResponse.json({
      success: true,
      data: session
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}

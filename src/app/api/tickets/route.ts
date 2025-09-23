import { NextRequest, NextResponse } from 'next/server';
import { db, Ticket } from '@/lib/database';

// GET /api/tickets - Get all tickets with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedAgentId = searchParams.get('assignedAgentId');
    const customerId = searchParams.get('customerId');

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (assignedAgentId) filters.assignedAgentId = assignedAgentId;
    if (customerId) filters.customerId = customerId;

    const tickets = await db.getTickets(filters);

    return NextResponse.json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ticketData = {
      title: body.title,
      description: body.description,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      category: body.category || 'General Inquiry',
      tags: body.tags || [],
      customerId: body.customerId,
      assignedAgentId: body.assignedAgentId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      slaHours: body.slaHours || 24,
      source: body.source || 'web',
      metadata: body.metadata || {}
    };

    const ticket = await db.createTicket(ticketData);

    return NextResponse.json({
      success: true,
      data: ticket
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

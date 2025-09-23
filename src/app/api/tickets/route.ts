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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedAgentId = searchParams.get("assignedAgentId");
    const customerId = searchParams.get("customerId");

    const whereClause: any = {};

    if (status) {
      if (status.includes(",")) {
        whereClause.status = { in: status.split(",") };
      } else {
        whereClause.status = status;
      }
    }

    if (priority) {
      if (priority.includes(",")) {
        whereClause.priority = { in: priority.split(",") };
      } else {
        whereClause.priority = priority;
      }
    }

    if (category) {
      if (category.includes(",")) {
        whereClause.category = { in: category.split(",") };
      } else {
        whereClause.category = category;
      }
    }

    if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
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
    const {
      title,
      description,
      status,
      priority,
      category,
      tags,
      customerId,
      assignedAgentId,
      slaHours,
      source,
      metadata,
    } = body;

    // Validate required fields
    if (!title || !description || !category || !customerId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        status: status || "open",
        priority: priority || "medium",
        category,
        tags: tags || [],
        customerId,
        assignedAgentId,
        slaHours: slaHours || 24,
        source: source || "web",
        metadata: metadata || {},
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

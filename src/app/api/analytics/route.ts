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
    const timeRange = searchParams.get("timeRange") || "30d";

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch tickets within the date range
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
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

    // Calculate metrics
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;

    // Calculate average resolution time
    const resolvedTicketsWithTime = tickets.filter((t: any) => t.resolvedAt);
    const avgResolutionTime = resolvedTicketsWithTime.length > 0
      ? resolvedTicketsWithTime.reduce((acc: number, t: any) => {
          const resolutionTime = t.resolvedAt ? t.resolvedAt.getTime() - t.createdAt.getTime() : 0;
          return acc + resolutionTime;
        }, 0) / resolvedTicketsWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate average response time (simplified - would need chat data for accurate calculation)
    const avgResponseTime = 2.3; // This would need to be calculated from chat messages

    // Calculate customer satisfaction (average of satisfaction scores)
    const ticketsWithSatisfaction = tickets.filter((t: any) => t.satisfaction !== null);
    const customerSatisfaction = ticketsWithSatisfaction.length > 0
      ? ticketsWithSatisfaction.reduce((acc: number, t: any) => acc + (t.satisfaction || 0), 0) / ticketsWithSatisfaction.length
      : 0;

    // Agent performance
    const agents = await prisma.user.findMany({
      where: {
        role: "agent",
      },
      include: {
        tickets: {
          where: {
            createdAt: {
              gte: startDate,
              lte: now,
            },
          },
        },
      },
    });

    const agentPerformance = agents.map((agent: any) => {
      const userTickets = agent.tickets;
      const resolvedUserTickets = userTickets.filter((t: any) => t.status === "resolved" || t.status === "closed");

      return {
        id: agent.id,
        name: agent.name || "Unknown",
        ticketsResolved: resolvedUserTickets.length,
        avgResponseTime: 2.5, // Mock value - would need chat data
        satisfaction: 4.5, // Mock value - would need satisfaction data
        status: "online", // Mock value - would need real-time status
      };
    });

    // Ticket trends (daily for the last 7 days)
    const ticketTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTickets = tickets.filter((t: any) =>
        t.createdAt.toDateString() === date.toDateString()
      );
      const resolvedDayTickets = dayTickets.filter((t: any) => t.status === "resolved" || t.status === "closed");

      ticketTrends.push({
        date: date.toISOString().split('T')[0],
        tickets: dayTickets.length,
        resolved: resolvedDayTickets.length,
      });
    }

    // Top issues
    const categoryCounts: Record<string, number> = {};
    tickets.forEach((ticket: any) => {
      categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
    });

    const topIssues = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count: count as number,
        percentage: totalTickets > 0 ? Math.round((count as number / totalTickets) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analyticsData = {
      totalTickets,
      resolvedTickets,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
      agentPerformance,
      ticketTrends,
      topIssues,
    };

    return NextResponse.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'overview';

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const analytics = await db.getAnalytics(dateRange);

    // Calculate real-time metrics
    const currentMetrics = await calculateCurrentMetrics();

    // Generate trends data
    const trends = await generateTrendsData();

    // Performance insights
    const insights = await generateInsights();

    return NextResponse.json({
      success: true,
      data: {
        overview: analytics,
        current: currentMetrics,
        trends,
        insights
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function calculateCurrentMetrics() {
  const tickets = await db.getTickets();
  const now = new Date();

  // Today's tickets
  const todayTickets = tickets.filter(t =>
    t.createdAt.toDateString() === now.toDateString()
  );

  // This week's tickets
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekTickets = tickets.filter(t => t.createdAt >= weekAgo);

  // Calculate averages
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const avgResolutionTime = resolvedTickets.length > 0
    ? resolvedTickets.reduce((sum, t) => {
        if (t.resolvedAt) {
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime());
        }
        return sum;
      }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  return {
    today: {
      tickets: todayTickets.length,
      resolved: todayTickets.filter(t => t.status === 'resolved').length,
      avgResponseTime: 2.3, // Mock data
      satisfaction: 4.2
    },
    week: {
      tickets: weekTickets.length,
      resolved: weekTickets.filter(t => t.status === 'resolved').length,
      avgResolutionTime,
      satisfaction: 4.1
    },
    agents: {
      online: 8,
      total: 12,
      utilization: 75
    }
  };
}

async function generateTrendsData() {
  // Generate mock trend data for the last 30 days
  const trends = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    trends.push({
      date: date.toISOString().split('T')[0],
      tickets: Math.floor(Math.random() * 50) + 20,
      resolved: Math.floor(Math.random() * 40) + 15,
      satisfaction: Math.random() * 1 + 4, // 4.0 to 5.0
      responseTime: Math.random() * 3 + 1 // 1 to 4 hours
    });
  }

  return trends;
}

async function generateInsights() {
  const tickets = await db.getTickets();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentTickets = tickets.filter(t => t.createdAt >= weekAgo);
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved');
  const overdueTickets = tickets.filter(t =>
    t.dueDate && t.dueDate < now && t.status !== 'resolved'
  );

  return {
    alerts: [
      urgentTickets.length > 0 && {
        type: 'urgent',
        message: `${urgentTickets.length} urgent tickets require immediate attention`,
        priority: 'high'
      },
      overdueTickets.length > 0 && {
        type: 'overdue',
        message: `${overdueTickets.length} tickets are overdue`,
        priority: 'medium'
      }
    ].filter(Boolean),
    recommendations: [
      recentTickets.length > 50 && {
        type: 'staffing',
        message: 'Consider increasing agent capacity due to high ticket volume',
        action: 'Review staffing levels'
      },
      urgentTickets.length > 5 && {
        type: 'priority',
        message: 'Multiple urgent tickets pending - prioritize resolution',
        action: 'Reassign urgent tickets'
      }
    ].filter(Boolean),
    performance: {
      improvement: recentTickets.length > 0 ? Math.random() * 15 + 5 : 0, // 5-20% improvement
      areas: ['Response Time', 'Customer Satisfaction', 'Resolution Rate']
    }
  };
}

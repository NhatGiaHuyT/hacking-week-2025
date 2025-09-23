import { NextRequest, NextResponse } from 'next/server';

interface TicketAnalysis {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  relatedTickets: RelatedTicket[];
  suggestedActions: string[];
  knowledgeGaps: string[];
  resolutionPatterns: ResolutionPattern[];
}

interface RelatedTicket {
  id: string;
  title: string;
  status: string;
  similarity: number;
  resolution: string;
  createdAt: string;
}

interface ResolutionPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  avgResolutionTime: number;
}

interface CustomerInsight {
  behavior: string;
  commonIssues: string[];
  satisfaction: number;
  preferredChannels: string[];
}

// Mock data for demonstration
const mockRelatedTickets: RelatedTicket[] = [
  {
    id: "#1234",
    title: "Login issue after password reset",
    status: "resolved",
    similarity: 95,
    resolution: "Reset password and cleared browser cache",
    createdAt: "2 days ago"
  },
  {
    id: "#1256",
    title: "Account access problem",
    status: "resolved",
    similarity: 87,
    resolution: "Verified account credentials and updated security settings",
    createdAt: "1 week ago"
  },
  {
    id: "#1290",
    title: "Authentication error",
    status: "resolved",
    similarity: 76,
    resolution: "Updated authentication tokens and cleared session data",
    createdAt: "3 days ago"
  }
];

const mockResolutionPatterns: ResolutionPattern[] = [
  {
    pattern: "Password Reset Issues",
    frequency: 45,
    successRate: 92,
    avgResolutionTime: 2.3
  },
  {
    pattern: "Account Lockouts",
    frequency: 23,
    successRate: 88,
    avgResolutionTime: 1.8
  },
  {
    pattern: "2FA Problems",
    frequency: 18,
    successRate: 95,
    avgResolutionTime: 3.1
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode, taskType } = body;

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (mode === 'ticket') {
      // Analyze ticket text and generate mock analysis
      const analysis: TicketAnalysis = {
        id: `#${Math.floor(Math.random() * 10000)}`,
        title: generateTicketTitle(text),
        category: determineCategory(text, taskType),
        priority: determinePriority(text),
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
        relatedTickets: mockRelatedTickets,
        suggestedActions: generateSuggestedActions(text),
        knowledgeGaps: generateKnowledgeGaps(text),
        resolutionPatterns: mockResolutionPatterns
      };

      return NextResponse.json({
        success: true,
        analysis: analysis
      });
    }

    if (mode === 'insights') {
      const insights: CustomerInsight = {
        behavior: "Customer shows consistent communication patterns and prefers detailed technical explanations.",
        commonIssues: [
          "Authentication and login problems",
          "Account security concerns",
          "Password management issues"
        ],
        satisfaction: 4.2,
        preferredChannels: ["Email", "Chat Support", "Phone"]
      };

      return NextResponse.json({
        success: true,
        insights: insights
      });
    }

    if (mode === 'knowledge') {
      return NextResponse.json({
        success: true,
        message: "Knowledge base entry processed successfully"
      });
    }

    if (mode === 'patterns') {
      return NextResponse.json({
        success: true,
        patterns: mockResolutionPatterns,
        recommendations: [
          "Implement proactive password reset notifications",
          "Add automated account unlock feature",
          "Enhance 2FA recovery process"
        ]
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid analysis mode"
    }, { status: 400 });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: "Analysis failed"
    }, { status: 500 });
  }
}

function generateTicketTitle(text: string): string {
  // Simple title generation based on text content
  const words = text.split(' ').slice(0, 6);
  return words.join(' ') + (words.length >= 6 ? '...' : '');
}

function determineCategory(text: string, taskType: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('login') || lowerText.includes('password') || lowerText.includes('account')) {
    return 'Authentication';
  }
  if (lowerText.includes('payment') || lowerText.includes('billing') || lowerText.includes('charge')) {
    return 'Billing';
  }
  if (lowerText.includes('technical') || lowerText.includes('error') || lowerText.includes('bug')) {
    return 'Technical Support';
  }

  return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function determinePriority(text: string): 'low' | 'medium' | 'high' | 'urgent' {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('emergency')) {
    return 'urgent';
  }
  if (lowerText.includes('important') || lowerText.includes('asap') || lowerText.includes('broken')) {
    return 'high';
  }
  if (lowerText.includes('soon') || lowerText.includes('when possible')) {
    return 'medium';
  }

  return 'low';
}

function generateSuggestedActions(text: string): string[] {
  const actions = [
    "Verify customer account credentials",
    "Check system logs for related errors",
    "Test the reported functionality",
    "Document the issue in the knowledge base",
    "Escalate to senior support if needed"
  ];

  // Add specific actions based on content
  const lowerText = text.toLowerCase();
  if (lowerText.includes('login')) {
    actions.push("Reset customer password");
    actions.push("Clear browser cache and cookies");
  }
  if (lowerText.includes('error')) {
    actions.push("Check error logs for detailed information");
    actions.push("Test alternative solutions");
  }

  return actions;
}

function generateKnowledgeGaps(text: string): string[] {
  const gaps = [
    "Document the exact error message and reproduction steps",
    "Add troubleshooting guide for similar issues",
    "Update FAQ with common solutions"
  ];

  const lowerText = text.toLowerCase();
  if (lowerText.includes('login')) {
    gaps.push("Create step-by-step login troubleshooting guide");
    gaps.push("Document browser compatibility issues");
  }

  return gaps;
}

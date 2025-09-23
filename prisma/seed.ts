import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        company: 'Tech Solutions Inc',
        status: 'active',
        preferences: { notifications: true, language: 'en' },
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        company: 'Digital Marketing Co',
        status: 'active',
        preferences: { notifications: true, language: 'en' },
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1-555-0125',
        company: 'StartupXYZ',
        status: 'active',
        preferences: { notifications: false, language: 'en' },
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+1-555-0126',
        company: 'E-commerce Plus',
        status: 'active',
        preferences: { notifications: true, language: 'en' },
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Tech Corp',
        email: 'support@techcorp.com',
        phone: '+1-555-0127',
        company: 'Tech Corp',
        status: 'active',
        preferences: { notifications: true, language: 'en' },
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create agents
  const hashedPassword = await bcrypt.hash('password123', 12);

  const agents = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        role: 'agent',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@company.com',
        role: 'agent',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carol Davis',
        email: 'carol@company.com',
        role: 'agent',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Wilson',
        email: 'david@company.com',
        role: 'agent',
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${agents.length} agents`);

  // Create tickets
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: 'Login issue after password reset',
        description: 'Customer unable to access account after password reset. Error message: "Invalid credentials". Multiple failed attempts.',
        status: 'open',
        priority: 'high',
        category: 'Authentication',
        tags: ['login', 'password', 'urgent'],
        customerId: customers[0].id,
        slaHours: 24,
        source: 'web',
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Billing discrepancy in monthly invoice',
        description: 'Customer reports incorrect charges on monthly bill. Amount differs from agreed pricing plan.',
        status: 'in-progress',
        priority: 'medium',
        category: 'Billing',
        tags: ['billing', 'invoice', 'discrepancy'],
        customerId: customers[1].id,
        assignedAgentId: agents[0].id,
        slaHours: 48,
        source: 'email',
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Feature request: Dark mode support',
        description: 'Customer requesting dark mode feature for better accessibility and user experience.',
        status: 'resolved',
        priority: 'low',
        category: 'Feature Request',
        tags: ['feature', 'ui', 'accessibility'],
        customerId: customers[2].id,
        assignedAgentId: agents[1].id,
        slaHours: 72,
        source: 'chat',
        satisfaction: 5,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'API rate limiting issue',
        description: 'Customer experiencing API rate limiting errors when making multiple requests per minute.',
        status: 'closed',
        priority: 'urgent',
        category: 'Technical',
        tags: ['api', 'rate-limit', 'technical'],
        customerId: customers[4].id,
        assignedAgentId: agents[2].id,
        slaHours: 4,
        source: 'api',
        satisfaction: 4,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Dashboard not loading properly',
        description: 'Dashboard shows loading spinner indefinitely. Browser console shows JavaScript errors.',
        status: 'open',
        priority: 'high',
        category: 'Technical',
        tags: ['dashboard', 'loading', 'javascript'],
        customerId: customers[3].id,
        slaHours: 24,
        source: 'web',
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Mobile app crashes on startup',
        description: 'Mobile application crashes immediately upon opening. Happens on both iOS and Android devices.',
        status: 'in-progress',
        priority: 'urgent',
        category: 'Technical',
        tags: ['mobile', 'crash', 'ios', 'android'],
        customerId: customers[0].id,
        assignedAgentId: agents[3].id,
        slaHours: 8,
        source: 'mobile',
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Export functionality not working',
        description: 'Unable to export data to CSV or PDF format. Export button appears to be disabled.',
        status: 'resolved',
        priority: 'medium',
        category: 'Technical',
        tags: ['export', 'csv', 'pdf'],
        customerId: customers[1].id,
        assignedAgentId: agents[0].id,
        slaHours: 48,
        source: 'web',
        satisfaction: 3,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Account suspension without notice',
        description: 'Customer account was suspended without prior notification. Need immediate resolution.',
        status: 'open',
        priority: 'urgent',
        category: 'Account',
        tags: ['account', 'suspension', 'urgent'],
        customerId: customers[2].id,
        slaHours: 2,
        source: 'phone',
      },
    }),
  ]);

  console.log(`✅ Created ${tickets.length} tickets`);

  // Create chat sessions
  const chatSessions = await Promise.all([
    prisma.chatSession.create({
      data: {
        customerId: customers[0].id,
        agentId: agents[0].id,
        status: 'active',
        priority: 'high',
        ticketId: tickets[0].id,
      },
    }),
    prisma.chatSession.create({
      data: {
        customerId: customers[1].id,
        agentId: agents[1].id,
        status: 'active',
        priority: 'medium',
        ticketId: tickets[1].id,
      },
    }),
    prisma.chatSession.create({
      data: {
        customerId: customers[2].id,
        status: 'waiting',
        priority: 'low',
        ticketId: tickets[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${chatSessions.length} chat sessions`);

  // Create chat messages
  const messages = [
    {
      sessionId: chatSessions[0].id,
      senderId: customers[0].id,
      senderType: 'customer',
      content: 'Hello, I\'m having trouble logging in after resetting my password.',
      type: 'text',
    },
    {
      sessionId: chatSessions[0].id,
      senderId: agents[0].id,
      senderType: 'agent',
      content: 'I understand. Let me help you with that. Can you tell me what error message you\'re seeing?',
      type: 'text',
    },
    {
      sessionId: chatSessions[0].id,
      senderId: customers[0].id,
      senderType: 'customer',
      content: 'It says "Invalid credentials" even though I just reset my password.',
      type: 'text',
    },
    {
      sessionId: chatSessions[1].id,
      senderId: customers[1].id,
      senderType: 'customer',
      content: 'Hi, I noticed an error in my latest invoice.',
      type: 'text',
    },
    {
      sessionId: chatSessions[1].id,
      senderId: agents[1].id,
      senderType: 'agent',
      content: 'Hello! I\'d be happy to help you with your billing issue. What seems to be the problem?',
      type: 'text',
    },
  ];

  for (const message of messages) {
    await prisma.chatMessage.create({
      data: message,
    });
  }

  console.log(`✅ Created ${messages.length} chat messages`);

  // Create analytics data
  const analyticsData = await Promise.all([
    prisma.analyticsData.create({
      data: {
        date: new Date(),
        metrics: {
          totalTickets: tickets.length,
          resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
          avgResponseTime: 2.3,
          avgResolutionTime: 24.5,
          customerSatisfaction: 4.2,
        },
        trends: {
          ticketVolume: 'increasing',
          resolutionRate: 'stable',
          satisfactionTrend: 'improving',
        },
      },
    }),
  ]);

  console.log(`✅ Created ${analyticsData.length} analytics records`);

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Agents: ${agents.length}`);
  console.log(`   - Tickets: ${tickets.length}`);
  console.log(`   - Chat Sessions: ${chatSessions.length}`);
  console.log(`   - Messages: ${messages.length}`);
  console.log(`   - Analytics: ${analyticsData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

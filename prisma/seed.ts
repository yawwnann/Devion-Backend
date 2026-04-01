import {
  PrismaClient,
  User,
  ProjectCategory,
  PaymentMethod,
  Project,
  Page,
  TodoWeek,
  CalendarEvent,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Types
type PageStatus = 'DRAFT' | 'PRIVATE' | 'PUBLISHED';

// Helper functions
const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const randomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const generateRandomString = (length: number) => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sample data
const sampleUsers = [
  { email: 'yawwnan01@gmail.com', name: 'Yuwananta', password: 'password123' },
  {
    email: 'user2@devion.app',
    name: 'Sarah Williams',
    password: 'password123',
  },
  { email: 'user3@devion.app', name: 'Michael Chen', password: 'password123' },
  { email: 'user4@devion.app', name: 'Emily Davis', password: 'password123' },
  { email: 'user5@devion.app', name: 'David Wilson', password: 'password123' },
];

const sampleCategories = [
  { name: 'Web Development', color: '#3b82f6' },
  { name: 'Mobile App', color: '#10b981' },
  { name: 'E-Commerce', color: '#f59e0b' },
  { name: 'SaaS', color: '#8b5cf6' },
  { name: 'Portfolio', color: '#ec4899' },
  { name: 'Enterprise', color: '#06b6d4' },
  { name: 'Startup', color: '#14b8a6' },
  { name: 'Freelance', color: '#f97316' },
];

const samplePaymentMethods = [
  { name: 'Bank Transfer', color: '#3b82f6' },
  { name: 'PayPal', color: '#0070ba' },
  { name: 'Stripe', color: '#635bff' },
  { name: 'Credit Card', color: '#10b981' },
  { name: 'Crypto', color: '#f7931a' },
  { name: 'Cash', color: '#22c55e' },
];

const sampleProjectNames = [
  'E-Commerce Platform',
  'Portfolio Website',
  'Task Management App',
  'Social Media Dashboard',
  'Restaurant Ordering System',
  'Real Estate Platform',
  'Fitness Tracker',
  'Learning Management System',
  'Booking System',
  'Inventory Management',
  'CRM Dashboard',
  'Analytics Platform',
  'Chat Application',
  'Video Streaming Service',
  'Music Player App',
  'Weather Dashboard',
  'News Aggregator',
  'Job Board Platform',
  'Dating App',
  'Food Delivery App',
  'Hotel Management System',
  'School Management System',
  'Hospital Management',
  'Banking App',
  'Insurance Platform',
  'Logistics Tracker',
  'Fleet Management',
  'HR Management System',
  'Accounting Software',
  'POS System',
  'Blog Platform',
  'Forum Website',
  'Marketplace Platform',
  'Auction Website',
  'Crowdfunding Platform',
  'Donation Platform',
  'Event Management',
  'Ticket Booking System',
  'Car Rental System',
  'Property Management',
  'Doctor Appointment',
  'Pharmacy Management',
  'Gym Management',
  'Salon Booking',
  'Laundry Service App',
  'Cleaning Service App',
  'Plumber Service App',
  'Electrician Service',
  'Legal Case Management',
  'Law Firm Website',
  'Consulting Platform',
  'Coaching Platform',
  'Meditation App',
  'Health Tracker',
  'Nutrition App',
  'Recipe App',
  'Travel Booking',
  'Flight Booking',
  'Train Booking',
  'Bus Booking',
  'Taxi Booking',
  'Ride Sharing',
  'Bike Rental',
  'Scooter Rental',
  'Parking Management',
  'Traffic Management',
  'Smart City Platform',
  'IoT Dashboard',
  'Home Automation',
  'Security System',
  'Surveillance Platform',
  'Access Control',
  'Time Tracking',
  'Invoice Generator',
  'Expense Tracker',
  'Budget Planner',
  'Investment Tracker',
  'Stock Portfolio',
  'Crypto Tracker',
  'Trading Platform',
  'Payment Gateway',
  'Wallet App',
  'Money Transfer',
  'Bill Splitter',
  'Document Management',
  'File Sharing',
  'Cloud Storage',
  'Backup Service',
  'Email Marketing',
  'SMS Marketing',
  'Push Notification',
  'Campaign Manager',
  'SEO Tool',
  'Keyword Research',
  'Backlink Checker',
  'Rank Tracker',
  'Social Media Scheduler',
  'Content Calendar',
  'Hashtag Generator',
  'Influencer Platform',
  'Video Editor',
  'Image Editor',
  'PDF Editor',
  'Code Editor',
  'Project Template',
  'Website Template',
  'App Template',
  'Design System',
  'UI Kit',
  'Icon Pack',
  'Font Library',
  'Color Palette Tool',
  'A/B Testing Tool',
  'Heatmap Tool',
  'User Feedback',
  'Survey Platform',
  'Knowledge Base',
  'Help Desk',
  'Live Chat',
  'Support Ticket',
  'API Documentation',
  'Developer Portal',
  'Status Page',
  'Monitoring Tool',
];

const sampleDocumentationTitles = [
  'Getting Started Guide',
  'API Documentation',
  'Installation Guide',
  'Quick Start Tutorial',
  'Best Practices',
  'Architecture Overview',
  'Database Schema',
  'Authentication Guide',
  'Authorization Guide',
  'User Management',
  'Role Based Access',
  'Permission System',
  'Deployment Guide',
  'CI/CD Pipeline',
  'Docker Setup',
  'Kubernetes Guide',
  'Testing Strategy',
  'Unit Testing',
  'Integration Testing',
  'E2E Testing',
  'Code Style Guide',
  'Git Workflow',
  'Branching Strategy',
  'Code Review Process',
  'Performance Optimization',
  'Caching Strategy',
  'Database Optimization',
  'Query Optimization',
  'Security Best Practices',
  'OWASP Top 10',
  'Data Encryption',
  'Secure Authentication',
  'Monitoring & Logging',
  'Error Handling',
  'Exception Management',
  'Alert System',
  'Backup & Recovery',
  'Disaster Recovery',
  'High Availability',
  'Scalability Guide',
  'Microservices Architecture',
  'Event Driven Architecture',
  'CQRS Pattern',
  'Event Sourcing',
  'REST API Design',
  'GraphQL Guide',
  'WebSocket Guide',
  'gRPC Introduction',
  'Message Queue',
  'RabbitMQ Setup',
  'Kafka Guide',
  'Redis Caching',
  'Elasticsearch Guide',
  'Search Implementation',
  'Full Text Search',
  'Faceted Search',
  'File Upload Guide',
  'Image Processing',
  'Video Processing',
  'CDN Integration',
  'Email Integration',
  'SMS Integration',
  'Push Notification',
  'Webhook Guide',
  'Payment Integration',
  'Stripe Setup',
  'PayPal Integration',
  'Crypto Payment',
  'Third Party APIs',
  'OAuth 2.0',
  'JWT Tokens',
  'Session Management',
  'Frontend Guide',
  'React Best Practices',
  'Vue Best Practices',
  'Angular Guide',
  'State Management',
  'Redux Guide',
  'Vuex Guide',
  'Context API',
  'Styling Guide',
  'Tailwind CSS',
  'CSS Modules',
  'Styled Components',
  'Responsive Design',
  'Mobile First',
  'PWA Guide',
  'Service Worker',
  'SEO Guide',
  'Meta Tags',
  'Sitemap',
  'Robots.txt',
  'Analytics Setup',
  'Google Analytics',
  'Custom Events',
  'Conversion Tracking',
  'A11y Guide',
  'WCAG Compliance',
  'Screen Reader',
  'Keyboard Navigation',
  'Internationalization',
  'Localization',
  'Multi Language',
  'RTL Support',
];

const sampleBlockContent = {
  text: {
    text: 'This is a sample text block with some content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  heading: { text: 'Sample Heading', level: 2 },
  todo: { text: 'Sample todo item', checked: false },
  code: { code: 'console.log("Hello, World!");' },
  quote: { text: 'This is a sample quote.' },
  callout: { text: 'This is a callout message.', type: 'info' },
};

const todoTitles = [
  'Fix bug in login page',
  'Update dependencies',
  'Write unit tests',
  'Review pull request',
  'Update documentation',
  'Fix CSS issues',
  'Optimize images',
  'Add error handling',
  'Implement search feature',
  'Add pagination',
  'Create API endpoint',
  'Write integration tests',
  'Fix responsive design',
  'Add loading states',
  'Implement caching',
  'Setup monitoring',
  'Configure CI/CD',
  'Update README',
  'Refactor code',
  'Add logging',
  'Fix performance issues',
  'Add validation',
  'Implement auth',
  'Setup database',
  'Create components',
  'Add animations',
  'Fix accessibility',
  'Add tooltips',
  'Implement filters',
  'Add sorting',
  'Create dashboard',
  'Setup routing',
  'Add form validation',
  'Implement drag-drop',
  'Add keyboard shortcuts',
  'Create modals',
  'Add notifications',
  'Implement dark mode',
  'Add export feature',
  'Create reports',
  'Setup email templates',
  'Add webhooks',
  'Implement rate limiting',
  'Add rate limiting',
  'Create admin panel',
  'Add user roles',
  'Implement permissions',
  'Add audit log',
  'Setup backups',
  'Configure SSL',
  'Add health checks',
  'Implement retry logic',
  'Add retry mechanism',
  'Implement queue',
  'Setup workers',
  'Add job scheduler',
  'Create webhooks',
  'Add API versioning',
  'Implement throttling',
  'Add request logging',
  'Setup error tracking',
  'Add performance monitoring',
  'Create alerts',
  'Setup dashboards',
  'Add custom metrics',
  'Implement tracing',
  'Add correlation IDs',
  'Setup log aggregation',
  'Create runbooks',
  'Add incident management',
  'Implement on-call',
  'Setup paging',
  'Add status page',
  'Create changelog',
  'Add release notes',
  'Setup versioning',
  'Implement feature flags',
  'Add A/B testing',
  'Create experiments',
  'Setup analytics',
  'Add user tracking',
  'Implement funnels',
  'Create cohorts',
  'Setup segmentation',
  'Add personalization',
  'Implement recommendations',
  'Create suggestions',
  'Setup machine learning',
  'Add predictions',
  'Implement forecasting',
  'Create models',
  'Setup training',
  'Add data pipeline',
  'Implement ETL',
  'Create data warehouse',
  'Setup data lake',
  'Add data quality',
  'Implement validation',
  'Create data catalog',
  'Setup governance',
  'Add compliance',
  'Implement privacy',
  'Create consent management',
  'Setup GDPR',
];

const todoDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const todoPriorities = ['HIGH', 'MEDIUM', 'LOW'];
const todoStatuses = ['TODO', 'SCHEDULED', 'IN_PROGRESS', 'DONE'];

const eventTitles = [
  'Project Kickoff',
  'Sprint Planning',
  'Daily Standup',
  'Sprint Review',
  'Sprint Retrospective',
  'Client Meeting',
  'Team Building',
  'Training Session',
  'Code Review',
  'Design Review',
  'Architecture Review',
  'Security Review',
  'Performance Review',
  '1:1 Meeting',
  'All Hands',
  'Town Hall',
  'Product Demo',
  'User Research',
  'Usability Testing',
  'A/B Test Review',
  'Launch Party',
  'Release Planning',
  'Roadmap Review',
  'Strategy Session',
  'Brainstorming',
  'Workshop',
  'Hackathon',
  'Innovation Day',
  'Conference',
  'Meetup',
  'Webinar',
  'Online Course',
  'Certification Exam',
  'Interview',
  'Onboarding',
  'Offboarding',
  'Vacation',
  'Sick Leave',
  'Public Holiday',
  'Company Event',
  'Birthday',
  'Anniversary',
  'Celebration',
  'Team Lunch',
  'Doctor Appointment',
  'Dentist',
  'Gym Session',
  'Yoga Class',
  'Running',
  'Cycling',
  'Swimming',
  'Hiking',
  'Family Time',
  'Date Night',
  'Movie Night',
  'Game Night',
  'Reading Time',
  'Learning Time',
  'Side Project',
  'Open Source',
  'Blog Writing',
  'Content Creation',
  'Video Recording',
  'Podcast',
  'Networking',
  'Mentoring',
  'Coaching',
  'Teaching',
  'Volunteering',
  'Community Service',
  'Charity Event',
  'Fundraising',
  'Shopping',
  'Grocery',
  'Errands',
  'Home Maintenance',
  'Car Maintenance',
  'Pet Care',
  'Gardening',
  'Cleaning',
  'Cooking',
  'Baking',
  'Meal Prep',
  'Recipe Testing',
];

async function main() {
  console.log('🌱 Starting seed...');

  // 0. Clean up existing data
  console.log('🧹 Cleaning up existing data...');

  try {
    // Delete in correct order (respecting foreign key constraints)
    await prisma.block.deleteMany({});
    console.log('   ✅ Deleted all blocks');

    await prisma.calendarEvent.deleteMany({});
    console.log('   ✅ Deleted all calendar events');

    await prisma.todo.deleteMany({});
    console.log('   ✅ Deleted all todos');

    await prisma.todoWeek.deleteMany({});
    console.log('   ✅ Deleted all todo weeks');

    await prisma.page.deleteMany({});
    console.log('   ✅ Deleted all pages');

    await prisma.project.deleteMany({});
    console.log('   ✅ Deleted all projects');

    await prisma.gitHubRepo.deleteMany({});
    console.log('   ✅ Deleted all GitHub repos');

    await prisma.analyticsEvent.deleteMany({});
    console.log('   ✅ Deleted all analytics events');

    await prisma.projectCategory.deleteMany({});
    console.log('   ✅ Deleted all project categories');

    await prisma.paymentMethod.deleteMany({});
    console.log('   ✅ Deleted all payment methods');

    await prisma.user.deleteMany({});
    console.log('   ✅ Deleted all users');

    console.log('✨ Database cleaned successfully!\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }

  // 1. Seed Users
  console.log('👤 Seeding users...');
  const users: User[] = [];
  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        bio: `Hello, I'm ${userData.name}. A passionate developer.`,
      },
    });
    users.push(user);
    console.log(`   ✅ Created user: ${user.email}`);
  }

  // 2. Seed Categories
  console.log('📁 Seeding categories...');
  const categories: ProjectCategory[] = [];
  for (const catData of sampleCategories) {
    const category = await prisma.projectCategory.upsert({
      where: { userId_name: { userId: users[0].id, name: catData.name } },
      update: {},
      create: {
        userId: users[0].id,
        name: catData.name,
        color: catData.color,
      },
    });
    categories.push(category);
  }
  console.log(`   ✅ Created ${categories.length} categories`);

  // 3. Seed Payment Methods
  console.log('💳 Seeding payment methods...');
  const paymentMethods: PaymentMethod[] = [];
  for (const pmData of samplePaymentMethods) {
    const paymentMethod = await prisma.paymentMethod.upsert({
      where: { userId_name: { userId: users[0].id, name: pmData.name } },
      update: {},
      create: {
        userId: users[0].id,
        name: pmData.name,
        color: pmData.color,
      },
    });
    paymentMethods.push(paymentMethod);
  }
  console.log(`   ✅ Created ${paymentMethods.length} payment methods`);

  // 4. Seed Projects (100+ projects)
  console.log('📦 Seeding projects (100+)...');
  const projects: Project[] = [];
  const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  const now = new Date();

  for (let i = 0; i < 120; i++) {
    const project = await prisma.project.create({
      data: {
        userId: users[0].id,
        name: `${sampleProjectNames[i % sampleProjectNames.length]} #${i + 1}`,
        order: `Order ${i + 1}`,
        status: randomElement(statuses),
        information: `This is a sample project description for project ${i + 1}. Lorem ipsum dolor sit amet.`,
        orderNum: i + 1,
        categoryId: randomElement(categories).id,
        paymentId: randomElement(paymentMethods).id,
        startDate: randomDate(new Date(2024, 0, 1), now),
        dueDate: randomDate(now, new Date(2026, 11, 31)),
      },
    });
    projects.push(project);

    if ((i + 1) % 20 === 0) {
      console.log(`   📦 Created ${i + 1} projects...`);
    }
  }
  console.log(`   ✅ Created ${projects.length} projects`);

  // 5. Seed Documentation Pages (50+ pages)
  console.log('📄 Seeding documentation pages (50+)...');
  const pages: Page[] = [];
  const pageStatuses: PageStatus[] = ['DRAFT', 'PRIVATE', 'PUBLISHED'];

  for (let i = 0; i < 60; i++) {
    const status = i < 15 ? 'DRAFT' : i < 30 ? 'PRIVATE' : 'PUBLISHED';
    const publishedAt =
      status === 'PUBLISHED' ? randomDate(new Date(2024, 0, 1), now) : null;

    const page = await prisma.page.create({
      data: {
        userId: users[0].id,
        title: `${sampleDocumentationTitles[i % sampleDocumentationTitles.length]} - Part ${Math.floor(i / sampleDocumentationTitles.length) + 1}`,
        icon: randomElement([
          '📄',
          '📝',
          '',
          '📖',
          '📋',
          '🗂️',
          '💡',
          '⚙️',
          '🚀',
          '🎯',
        ]),
        status,
        publishedAt,
        isFavorite: Math.random() < 0.2,
        isArchived: Math.random() < 0.05,
      },
    });
    pages.push(page);

    if ((i + 1) % 10 === 0) {
      console.log(`   📄 Created ${i + 1} pages...`);
    }
  }
  console.log(`   ✅ Created ${pages.length} documentation pages`);

  // 6. Seed Blocks (200+ blocks)
  console.log('🧱 Seeding blocks (200+)...');
  const blockTypes = ['text', 'heading', 'todo', 'code', 'quote', 'callout'];
  let blockCount = 0;

  for (const page of pages.slice(0, 40)) {
    const numBlocks = Math.floor(Math.random() * 8) + 3; // 3-10 blocks per page

    for (let j = 0; j < numBlocks; j++) {
      const type = randomElement(blockTypes);
      await prisma.block.create({
        data: {
          pageId: page.id,
          type,
          content: sampleBlockContent[
            type as keyof typeof sampleBlockContent
          ] || { text: 'Sample content' },
          order: j,
        },
      });
      blockCount++;
    }
  }
  console.log(`   ✅ Created ${blockCount} blocks`);

  // 7. Seed Todo Weeks and Todos (200+ todos)
  console.log('✅ Seeding todos (200+)...');
  const weekStarts: Date[] = [];
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStarts.push(weekStart);
  }

  const todoWeeks: TodoWeek[] = [];
  for (const weekStart of weekStarts) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const todoWeek = await prisma.todoWeek.upsert({
      where: { userId_weekStart: { userId: users[0].id, weekStart } },
      update: {},
      create: {
        userId: users[0].id,
        weekStart,
        weekEnd,
      },
    });
    todoWeeks.push(todoWeek);
  }

  let todoCount = 0;
  for (const todoWeek of todoWeeks) {
    const numTodos = Math.floor(Math.random() * 10) + 15; // 15-25 todos per week

    for (let i = 0; i < numTodos; i++) {
      await prisma.todo.create({
        data: {
          weekId: todoWeek.id,
          title: randomElement(todoTitles),
          day: randomElement(todoDays),
          priority: randomElement(todoPriorities),
          status: randomElement(todoStatuses),
          isCompleted: Math.random() < 0.4,
          order: i,
          dueDate: randomDate(todoWeek.weekStart, todoWeek.weekEnd),
        },
      });
      todoCount++;
    }
  }
  console.log(`   ✅ Created ${todoCount} todos`);

  // 8. Seed Calendar Events (50+ events)
  console.log('📅 Seeding calendar events (50+)...');
  const eventTypes = ['project', 'todo', 'custom'];
  let eventCount = 0;

  for (let i = 0; i < 60; i++) {
    const startDate = randomDate(new Date(2025, 0, 1), new Date(2026, 11, 31));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 4) + 1);

    await prisma.calendarEvent.create({
      data: {
        userId: users[0].id,
        title: `${eventTitles[i % eventTitles.length]} ${i + 1}`,
        description: `Description for event ${i + 1}`,
        startDate,
        endDate,
        allDay: Math.random() < 0.3,
        color: randomElement([
          'blue',
          'green',
          'red',
          'yellow',
          'purple',
          'orange',
          'pink',
        ]),
        eventType: randomElement(eventTypes),
        projectId: Math.random() < 0.5 ? randomElement(projects).id : null,
      },
    });
    eventCount++;
  }
  console.log(`   ✅ Created ${eventCount} calendar events`);

  // 9. Seed GitHub Repos (10 repos without actual GitHub API)
  console.log('🐙 Seeding GitHub repos (mock data)...');
  const sampleRepos = [
    'devion-platform',
    'task-manager',
    'e-commerce-app',
    'portfolio-website',
    'api-gateway',
    'mobile-app',
    'design-system',
    'cli-tool',
    'documentation-site',
    'testing-framework',
  ];

  for (const repoName of sampleRepos) {
    await prisma.gitHubRepo.upsert({
      where: {
        userId_repoId: {
          userId: users[0].id,
          repoId: Math.floor(Math.random() * 1000000),
        },
      },
      update: {},
      create: {
        userId: users[0].id,
        repoId: Math.floor(Math.random() * 1000000),
        name: repoName,
        fullName: `${users[0].name?.split(' ')[0].toLowerCase()}/${repoName}`,
        description: `A sample ${repoName} project for demonstration`,
        url: `https://github.com/${users[0].name?.split(' ')[0].toLowerCase()}/${repoName}`,
        language: randomElement([
          'TypeScript',
          'JavaScript',
          'Python',
          'Go',
          'Rust',
        ]),
        stars: Math.floor(Math.random() * 1000),
        forks: Math.floor(Math.random() * 100),
        openIssues: Math.floor(Math.random() * 50),
        isPrivate: Math.random() < 0.3,
        githubUpdatedAt: randomDate(new Date(2024, 0, 1), now),
        lastSyncedAt: now,
      },
    });
  }
  console.log(`   ✅ Created 10 GitHub repos (mock)`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👤 Users: ${users.length}`);
  console.log(`   📁 Categories: ${categories.length}`);
  console.log(`   💳 Payment Methods: ${paymentMethods.length}`);
  console.log(`   📦 Projects: ${projects.length}`);
  console.log(`   📄 Documentation Pages: ${pages.length}`);
  console.log(`   🧱 Blocks: ${blockCount}`);
  console.log(`   ✅ Todos: ${todoCount}`);
  console.log(`   📅 Calendar Events: ${eventCount}`);
  console.log(`   🐙 GitHub Repos: 10`);
  console.log('\n🔐 Test Credentials:');
  console.log(`   Email: user1@devion.app`);
  console.log(`   Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

/**
 * Seed Categories - Main and Sub Categories
 * 
 * This seed file creates all main categories and their sub categories
 * with proper parent-child relationships.
 */

async function main() {
  console.log('🌱 Starting category seed...');

  // Clear existing categories (optional - comment out if you want to keep existing data)
  // await prisma.category.deleteMany({});

  // ============================================
  // MAIN CATEGORIES
  // ============================================
  
  // Politics
  const politics = await prisma.category.upsert({
    where: { slug: 'politics' },
    update: {},
    create: {
      name: 'Politics',
      slug: 'politics',
      description: 'Political discussions, policies, and governance',
    },
  });

  // Economics
  const economics = await prisma.category.upsert({
    where: { slug: 'economics' },
    update: {},
    create: {
      name: 'Economics',
      slug: 'economics',
      description: 'Economic policies, markets, and financial systems',
    },
  });

  // Technology
  const technology = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology trends, innovations, and digital issues',
    },
  });

  // Celebrities
  const celebrities = await prisma.category.upsert({
    where: { slug: 'celebrities' },
    update: {},
    create: {
      name: 'Celebrities',
      slug: 'celebrities',
      description: 'Celebrity news, entertainment, and pop culture',
    },
  });

  // Sports
  const sports = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {},
    create: {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports news, teams, athletes, and competitions',
    },
  });

  // Health & Wellness
  const healthWellness = await prisma.category.upsert({
    where: { slug: 'health-wellness' },
    update: {},
    create: {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      description: 'Health, fitness, medical, and wellness topics',
    },
  });

  // Education
  const education = await prisma.category.upsert({
    where: { slug: 'education' },
    update: {},
    create: {
      name: 'Education',
      slug: 'education',
      description: 'Educational systems, policies, and learning',
    },
  });

  // Environment & Climate
  const environment = await prisma.category.upsert({
    where: { slug: 'environment-climate' },
    update: {},
    create: {
      name: 'Environment & Climate',
      slug: 'environment-climate',
      description: 'Environmental issues, climate change, and sustainability',
    },
  });

  // Social Issues
  const socialIssues = await prisma.category.upsert({
    where: { slug: 'social-issues' },
    update: {},
    create: {
      name: 'Social Issues',
      slug: 'social-issues',
      description: 'Social justice, equality, and community issues',
    },
  });

  // International Affairs
  const internationalAffairs = await prisma.category.upsert({
    where: { slug: 'international-affairs' },
    update: {},
    create: {
      name: 'International Affairs',
      slug: 'international-affairs',
      description: 'Global politics, diplomacy, and international relations',
    },
  });

  // Science & Research
  const scienceResearch = await prisma.category.upsert({
    where: { slug: 'science-research' },
    update: {},
    create: {
      name: 'Science & Research',
      slug: 'science-research',
      description: 'Scientific discoveries, research, and innovation',
    },
  });

  console.log('✅ Main categories created');

  // ============================================
  // SUB CATEGORIES - POLITICS
  // ============================================
  const politicsSubCategories = [
    { name: 'Immigration', slug: 'immigration' },
    { name: 'Abortion', slug: 'abortion' },
    { name: 'Civil Rights', slug: 'civil-rights' },
    { name: 'Public Safety', slug: 'public-safety' },
    { name: 'Elections & Voting', slug: 'elections-voting' },
    { name: 'Gun Control', slug: 'gun-control' },
    { name: 'Healthcare Policy', slug: 'healthcare-policy' },
    { name: 'Education Policy', slug: 'education-policy' },
    { name: 'Environmental Policy', slug: 'environmental-policy' },
    { name: 'Foreign Policy', slug: 'foreign-policy' },
    { name: 'Criminal Justice', slug: 'criminal-justice' },
    { name: 'Social Security', slug: 'social-security' },
    { name: 'Welfare Programs', slug: 'welfare-programs' },
    { name: 'Defense & Military', slug: 'defense-military' },
  ];

  for (const subCat of politicsSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: politics.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: politics.id,
      },
    });
  }

  console.log('✅ Politics sub categories created');

  // ============================================
  // SUB CATEGORIES - ECONOMICS
  // ============================================
  const economicsSubCategories = [
    { name: 'Taxes', slug: 'taxes' },
    { name: 'Trade & Tariffs', slug: 'trade-tariffs' },
    { name: 'Employment & Labor', slug: 'employment-labor' },
    { name: 'Inflation', slug: 'inflation' },
    { name: 'Federal Reserve', slug: 'federal-reserve' },
    { name: 'Budget & Spending', slug: 'budget-spending' },
    { name: 'Debt & Deficit', slug: 'debt-deficit' },
    { name: 'Stock Market', slug: 'stock-market' },
    { name: 'Cryptocurrency', slug: 'cryptocurrency' },
    { name: 'Housing Market', slug: 'housing-market' },
    { name: 'Poverty & Inequality', slug: 'poverty-inequality' },
    { name: 'Economic Growth', slug: 'economic-growth' },
    { name: 'Regulation', slug: 'regulation' },
    { name: 'Small Business', slug: 'small-business' },
  ];

  for (const subCat of economicsSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: economics.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: economics.id,
      },
    });
  }

  console.log('✅ Economics sub categories created');

  // ============================================
  // SUB CATEGORIES - TECHNOLOGY
  // ============================================
  const technologySubCategories = [
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
    { name: 'Privacy & Data', slug: 'privacy-data' },
    { name: 'Social Media', slug: 'social-media' },
    { name: 'Internet Regulation', slug: 'internet-regulation' },
    { name: 'Cybersecurity', slug: 'cybersecurity' },
    { name: 'Cryptocurrency & Blockchain', slug: 'cryptocurrency-blockchain' },
    { name: 'Electric Vehicles', slug: 'electric-vehicles' },
    { name: 'Space Technology', slug: 'space-technology' },
    { name: 'Tech Companies', slug: 'tech-companies' },
    { name: 'Innovation', slug: 'innovation' },
    { name: 'Digital Rights', slug: 'digital-rights' },
    { name: 'Software & Apps', slug: 'software-apps' },
    { name: 'Hardware', slug: 'hardware' },
    { name: 'Tech Jobs', slug: 'tech-jobs' },
  ];

  for (const subCat of technologySubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: technology.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: technology.id,
      },
    });
  }

  console.log('✅ Technology sub categories created');

  // ============================================
  // SUB CATEGORIES - CELEBRITIES
  // ============================================
  const celebritiesSubCategories = [
    { name: 'Entertainment Industry', slug: 'entertainment-industry' },
    { name: 'Music Artists', slug: 'music-artists' },
    { name: 'Actors & Actresses', slug: 'actors-actresses' },
    { name: 'Athletes', slug: 'athletes' },
    { name: 'Social Media Influencers', slug: 'social-media-influencers' },
    { name: 'Reality TV Stars', slug: 'reality-tv-stars' },
    { name: 'Celebrity Scandals', slug: 'celebrity-scandals' },
    { name: 'Celebrity Endorsements', slug: 'celebrity-endorsements' },
    { name: 'Celebrity Relationships', slug: 'celebrity-relationships' },
    { name: 'Award Shows', slug: 'award-shows' },
    { name: 'Celebrity Activism', slug: 'celebrity-activism' },
    { name: 'Celebrity Business Ventures', slug: 'celebrity-business-ventures' },
  ];

  for (const subCat of celebritiesSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: celebrities.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: celebrities.id,
      },
    });
  }

  console.log('✅ Celebrities sub categories created');

  // ============================================
  // SUB CATEGORIES - SPORTS
  // ============================================
  const sportsSubCategories = [
    { name: 'Football (NFL)', slug: 'football-nfl' },
    { name: 'Basketball (NBA)', slug: 'basketball-nba' },
    { name: 'Baseball (MLB)', slug: 'baseball-mlb' },
    { name: 'Soccer', slug: 'soccer' },
    { name: 'Olympics', slug: 'olympics' },
    { name: 'College Sports', slug: 'college-sports' },
    { name: 'Sports Betting', slug: 'sports-betting' },
    { name: 'Athlete Performance', slug: 'athlete-performance' },
    { name: 'Team Rivalries', slug: 'team-rivalries' },
    { name: 'Sports Business', slug: 'sports-business' },
    { name: 'Sports Injuries', slug: 'sports-injuries' },
    { name: 'Coaching & Management', slug: 'coaching-management' },
    { name: 'Draft & Trades', slug: 'draft-trades' },
    { name: 'Sports Media', slug: 'sports-media' },
  ];

  for (const subCat of sportsSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: sports.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: sports.id,
      },
    });
  }

  console.log('✅ Sports sub categories created');

  // ============================================
  // SUB CATEGORIES - HEALTH & WELLNESS
  // ============================================
  const healthWellnessSubCategories = [
    { name: 'Mental Health', slug: 'mental-health' },
    { name: 'Nutrition & Diet', slug: 'nutrition-diet' },
    { name: 'Exercise & Fitness', slug: 'exercise-fitness' },
    { name: 'Medical Research', slug: 'medical-research' },
    { name: 'Healthcare Access', slug: 'healthcare-access' },
    { name: 'Public Health', slug: 'public-health' },
    { name: 'Alternative Medicine', slug: 'alternative-medicine' },
    { name: 'Health Insurance', slug: 'health-insurance' },
    { name: 'Vaccines', slug: 'vaccines' },
    { name: 'Chronic Diseases', slug: 'chronic-diseases' },
    { name: 'Wellness Trends', slug: 'wellness-trends' },
    { name: 'Healthcare Workers', slug: 'healthcare-workers' },
  ];

  for (const subCat of healthWellnessSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: healthWellness.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: healthWellness.id,
      },
    });
  }

  console.log('✅ Health & Wellness sub categories created');

  // ============================================
  // SUB CATEGORIES - EDUCATION
  // ============================================
  const educationSubCategories = [
    { name: 'K-12 Education', slug: 'k-12-education' },
    { name: 'Higher Education', slug: 'higher-education' },
    { name: 'Student Debt', slug: 'student-debt' },
    { name: 'Curriculum', slug: 'curriculum' },
    { name: 'School Funding', slug: 'school-funding' },
    { name: 'Teachers & Staff', slug: 'teachers-staff' },
    { name: 'Standardized Testing', slug: 'standardized-testing' },
    { name: 'Online Learning', slug: 'online-learning' },
    { name: 'Private vs Public Schools', slug: 'private-vs-public-schools' },
    { name: 'College Admissions', slug: 'college-admissions' },
    { name: 'Education Reform', slug: 'education-reform' },
    { name: 'Student Life', slug: 'student-life' },
  ];

  for (const subCat of educationSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: education.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: education.id,
      },
    });
  }

  console.log('✅ Education sub categories created');

  // ============================================
  // SUB CATEGORIES - ENVIRONMENT & CLIMATE
  // ============================================
  const environmentSubCategories = [
    { name: 'Climate Change', slug: 'climate-change' },
    { name: 'Renewable Energy', slug: 'renewable-energy' },
    { name: 'Pollution', slug: 'pollution' },
    { name: 'Conservation', slug: 'conservation' },
    { name: 'Wildlife Protection', slug: 'wildlife-protection' },
    { name: 'Carbon Emissions', slug: 'carbon-emissions' },
    { name: 'Environmental Policy', slug: 'environmental-policy' },
    { name: 'Natural Disasters', slug: 'natural-disasters' },
    { name: 'Green Technology', slug: 'green-technology' },
    { name: 'Sustainability', slug: 'sustainability' },
    { name: 'Environmental Activism', slug: 'environmental-activism' },
    { name: 'Water & Air Quality', slug: 'water-air-quality' },
  ];

  for (const subCat of environmentSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: environment.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: environment.id,
      },
    });
  }

  console.log('✅ Environment & Climate sub categories created');

  // ============================================
  // SUB CATEGORIES - SOCIAL ISSUES
  // ============================================
  const socialIssuesSubCategories = [
    { name: 'LGBTQ+ Rights', slug: 'lgbtq-rights' },
    { name: 'Racial Justice', slug: 'racial-justice' },
    { name: 'Gender Equality', slug: 'gender-equality' },
    { name: 'Religious Freedom', slug: 'religious-freedom' },
    { name: 'Disability Rights', slug: 'disability-rights' },
    { name: 'Age Discrimination', slug: 'age-discrimination' },
    { name: 'Social Justice Movements', slug: 'social-justice-movements' },
    { name: 'Community Issues', slug: 'community-issues' },
    { name: 'Homelessness', slug: 'homelessness' },
    { name: 'Domestic Violence', slug: 'domestic-violence' },
    { name: 'Social Services', slug: 'social-services' },
  ];

  for (const subCat of socialIssuesSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: socialIssues.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: socialIssues.id,
      },
    });
  }

  console.log('✅ Social Issues sub categories created');

  // ============================================
  // SUB CATEGORIES - INTERNATIONAL AFFAIRS
  // ============================================
  const internationalAffairsSubCategories = [
    { name: 'War & Conflict', slug: 'war-conflict' },
    { name: 'International Relations', slug: 'international-relations' },
    { name: 'Diplomacy', slug: 'diplomacy' },
    { name: 'Global Economy', slug: 'global-economy' },
    { name: 'International Trade', slug: 'international-trade' },
    { name: 'Humanitarian Issues', slug: 'humanitarian-issues' },
    { name: 'Refugees & Migration', slug: 'refugees-migration' },
    { name: 'United Nations', slug: 'united-nations' },
    { name: 'Alliances', slug: 'alliances' },
    { name: 'International Organizations', slug: 'international-organizations' },
    { name: 'Global Health', slug: 'global-health' },
    { name: 'Cultural Exchange', slug: 'cultural-exchange' },
  ];

  for (const subCat of internationalAffairsSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: internationalAffairs.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: internationalAffairs.id,
      },
    });
  }

  console.log('✅ International Affairs sub categories created');

  // ============================================
  // SUB CATEGORIES - SCIENCE & RESEARCH
  // ============================================
  const scienceResearchSubCategories = [
    { name: 'Space Exploration', slug: 'space-exploration' },
    { name: 'Medical Research', slug: 'medical-research' },
    { name: 'Climate Science', slug: 'climate-science' },
    { name: 'Technology Research', slug: 'technology-research' },
    { name: 'Scientific Discoveries', slug: 'scientific-discoveries' },
    { name: 'Research Funding', slug: 'research-funding' },
    { name: 'Scientific Ethics', slug: 'scientific-ethics' },
    { name: 'Peer Review', slug: 'peer-review' },
    { name: 'Scientific Communication', slug: 'scientific-communication' },
    { name: 'Lab Work', slug: 'lab-work' },
  ];

  for (const subCat of scienceResearchSubCategories) {
    await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: { parentId: scienceResearch.id },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        parentId: scienceResearch.id,
      },
    });
  }

  console.log('✅ Science & Research sub categories created');

  console.log('🎉 Category seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


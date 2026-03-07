#!/bin/bash

# PostgreSQL Database Setup Script for ReportCard+
# This script will set up the database schema and seed data

echo "🚀 ReportCard+ PostgreSQL Database Setup"
echo "=========================================="

# Check if required tools are installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed. Please install bun first."
    echo "   Visit: https://bun.sh/docs/installation"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  Warning: psql is not installed. You may need it for manual database operations."
fi

echo "✅ Required tools check passed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create .env file with your database credentials."
    exit 1
fi

echo "✅ Environment file found"

# Test database connection
echo "🔗 Testing database connection..."
bunx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  await db.\$connect();
  console.log('✅ Database connection successful');
  await db.\$disconnect();
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection test failed. Please check your DATABASE_URL in .env file."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bunx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma client generation failed."
    exit 1
fi

# Push database schema (create/update tables)
echo "📊 Pushing database schema..."
bunx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Database schema push failed."
    exit 1
fi

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
bunx tsx seed-postgres.ts

if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed."
    exit 1
fi

echo ""
echo "🎉 PostgreSQL database setup completed successfully!"
echo ""
echo "📊 Database Summary:"
echo "   - Database: PostgreSQL (Neon)"
echo "   - Schema: ReportCard+ school management system"
echo "   - Tables: 15 models created"
echo "   - Sample data: Seeded with demo school"
echo ""
echo "🔑 Demo Login Credentials:"
echo "   Admin: admin@reportcardplus.com / admin123"
echo "   Teacher: teacher@reportcardplus.com / teacher123"
echo "   Student: student1@reportcardplus.com / student123"
echo ""
echo "🚀 Next steps:"
echo "   1. Run 'bun run dev' to start the development server"
echo "   2. Visit http://localhost:3000 to access the application"
echo "   3. Login with demo credentials to explore the features"
echo ""
echo "📚 For more information, check the README.md file"
#!/bin/bash

# PostgreSQL Database Reset Script for ReportCard+
# This script will reset the database and re-seed it

echo "🔄 ReportCard+ PostgreSQL Database Reset"
echo "======================================"

# Warning message
echo "⚠️  WARNING: This will delete all data in your PostgreSQL database!"
echo "   This action cannot be undone."
echo ""

# Ask for confirmation
read -p "Are you sure you want to reset the database? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Database reset cancelled."
    exit 0
fi

echo "✅ Proceeding with database reset..."

# Check if required tools are installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed. Please install bun first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create .env file with your database credentials."
    exit 1
fi

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

# Reset database (drop and recreate all tables)
echo "💥 Resetting database schema..."
bunx prisma db push --force-reset

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed."
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
echo "🎉 PostgreSQL database reset completed successfully!"
echo ""
echo "📊 Database Summary:"
echo "   - Database: PostgreSQL (Neon)"
echo "   - Schema: ReportCard+ school management system"
echo "   - Tables: 15 models created and reset"
echo "   - Sample data: Re-seeded with demo school"
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
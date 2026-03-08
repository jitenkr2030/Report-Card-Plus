#!/bin/bash

# ReportCard+ PostgreSQL Database Setup Script

echo "🚀 Setting up ReportCard+ PostgreSQL Database..."
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your PostgreSQL connection string."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

# Push database schema to PostgreSQL
echo "🗄️ Pushing database schema to PostgreSQL..."
bun run db:push

# Seed the database
echo "🌱 Seeding database with sample data..."
bunx tsx seed-postgres.ts

echo ""
echo "✅ PostgreSQL database setup completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start the development server: bun run dev"
echo "2. Visit: http://localhost:3000"
echo "3. Login with demo credentials"
echo ""
echo "🔑 Demo Credentials:"
echo "Admin: admin@reportcardplus.com / admin123"
echo "Teacher: teacher@reportcardplus.com / teacher123"
echo "Student: student1@reportcardplus.com / student123"
echo ""
echo "🚀 Your ReportCard+ platform is ready!"
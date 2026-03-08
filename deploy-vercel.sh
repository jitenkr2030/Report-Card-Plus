#!/bin/bash

# ReportCard+ Vercel Deployment Script

echo "🚀 Preparing ReportCard+ for Vercel deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please set DATABASE_URL in your environment or Vercel dashboard."
    echo ""
    echo "Example DATABASE_URL:"
    echo "DATABASE_URL=\"postgresql://neondb_owner:npg_yYwSk6fnQ1va@ep-green-leaf-a4yaueft-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require\""
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

# Push database schema to ensure it's up to date
echo "🗄️ Pushing database schema to PostgreSQL..."
bun run db:push

# Seed database if needed
echo "🌱 Checking database seeding..."
bunx tsx seed-postgres-simple.ts

echo "✅ Database setup completed"

# Check build
echo "🏗️ Building application..."
bun run build

echo "✅ Build completed successfully"
echo ""
echo "📋 Vercel Environment Variables Setup:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to your project > Settings > Environment Variables"
echo "3. Add the following variables:"
echo ""
echo "DATABASE_URL = $DATABASE_URL"
echo "NEXTAUTH_URL = https://report-card-plus-fpfxpn0q4-jiten-kumars-projects.vercel.app"
echo "NEXTAUTH_SECRET = your-secure-nextauth-secret"
echo "JWT_SECRET = your-secure-jwt-secret"
echo ""
echo "🚀 Ready for Vercel deployment!"
echo "Run 'vercel --prod' to deploy to production."
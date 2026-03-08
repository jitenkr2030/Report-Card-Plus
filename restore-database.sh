#!/bin/bash

# PostgreSQL Database Restore Script for ReportCard+
# This script will restore a database from a backup file

echo "🔄 ReportCard+ PostgreSQL Database Restore"
echo "=========================================="

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No backup file provided."
    echo "Usage: $0 <backup_file.gz>"
    echo "Example: $0 backups/reportcardplus_backup_20240302_143022.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

echo "📅 Restoring from backup: $BACKUP_FILE"

# Check if required tools are installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed. Please install bun first."
    exit 1
fi

if ! command -v gunzip &> /dev/null; then
    echo "❌ Error: gunzip is not installed. Please install gzip/gunzip first."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create .env file with your database credentials."
    exit 1
fi

# Extract database connection details from .env
DB_URL=$(grep "DATABASE_URL=" .env | cut -d'"' -f2)
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*)\?.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DB_URL | sed -n 's/.*:[^@]*@\([^:]*\):.*/\1/p')

echo "🔗 Connecting to database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Warning message
echo "⚠️  WARNING: This will delete all existing data in your database!"
echo "   This action cannot be undone."
echo ""

# Ask for confirmation
read -p "Are you sure you want to restore from '$BACKUP_FILE'? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Database restore cancelled."
    exit 0
fi

echo "✅ Proceeding with database restore..."

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

# Reset database schema
echo "💥 Resetting database schema..."
bunx prisma db push --force-reset

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed."
    exit 1
fi

# Restore data from backup
echo "🔄 Restoring data from backup..."
PGPASSWORD="$DB_PASSWORD" gunzip -c "$BACKUP_FILE" | psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --no-password

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database restore completed successfully!"
    echo "📊 Restored from: $BACKUP_FILE"
    
    # Regenerate Prisma client to sync with restored schema
    echo "🔧 Regenerating Prisma client..."
    bunx prisma generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma client regenerated successfully."
    else
        echo "⚠️  Warning: Prisma client regeneration failed. Please run 'bunx prisma generate' manually."
    fi
    
    # Verify restore by checking data
    echo "🔍 Verifying restore..."
    bunx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  await db.\$connect();
  
  const schoolCount = await db.school.count();
  const userCount = await db.user.count();
  const studentCount = await db.student.count();
  const teacherCount = await db.teacher.count();
  
  console.log('✅ Restore verification successful:');
  console.log(\`   Schools: \${schoolCount}\`);
  console.log(\`   Users: \${userCount}\`);
  console.log(\`   Students: \${studentCount}\`);
  console.log(\`   Teachers: \${teacherCount}\`);
  
  await db.\$disconnect();
} catch (error) {
  console.error('❌ Restore verification failed:', error.message);
  process.exit(1);
}
"
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore verification successful."
    else
        echo "⚠️  Warning: Restore verification failed. Please check your data."
    fi
    
else
    echo "❌ Database restore failed!"
    echo "Please check your backup file and database connection."
    exit 1
fi

echo ""
echo "🎉 Database restore completed successfully!"
echo ""
echo "📋 Restore Summary:"
echo "   - Restored from: $BACKUP_FILE"
echo "   - Database: PostgreSQL (Neon)"
echo "   - Schema: ReportCard+ school management system"
echo ""
echo "🚀 Next steps:"
echo "   1. Run 'bun run dev' to start the development server"
echo "   2. Visit http://localhost:3000 to access the application"
echo "   3. Login with your restored credentials to verify data"
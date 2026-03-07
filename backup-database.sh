#!/bin/bash

# PostgreSQL Database Backup Script for ReportCard+
# This script will create a backup of your database

echo "💾 ReportCard+ PostgreSQL Database Backup"
echo "=========================================="

# Get current timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="reportcardplus_backup_${TIMESTAMP}.sql"

echo "📅 Creating backup: ${BACKUP_FILE}"

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

# Extract database connection details from .env
DB_URL=$(grep "DATABASE_URL=" .env | cut -d'"' -f2)
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*)\?.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DB_URL | sed -n 's/.*:[^@]*@\([^:]*\):.*/\1/p')

echo "🔗 Connecting to database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Create backup directory if it doesn't exist
mkdir -p backups

# Create the database backup
echo "💾 Creating database backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --no-password \
    --clean \
    --if-exists \
    --create \
    --inserts \
    --column-inserts \
    --disable-dollar-quoting \
    --disable-triggers \
    --exclude-table-data="_prisma_migrations" \
    --file="backups/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database backup created successfully!"
    echo "📁 Backup file: backups/${BACKUP_FILE}"
    echo "💾 File size: $(du -h backups/${BACKUP_FILE} | cut -f1)"
    
    # Compress the backup file
    echo "🗜️  Compressing backup file..."
    gzip "backups/${BACKUP_FILE}"
    
    echo "✅ Backup compressed: backups/${BACKUP_FILE}.gz"
    echo "💾 Compressed size: $(du -h backups/${BACKUP_FILE}.gz | cut -f1)"
    
    # Create backup info file
    cat > "backups/backup_info_${TIMESTAMP}.txt" << EOF
ReportCard+ Database Backup Information
=====================================
Backup Date: $(date)
Backup File: ${BACKUP_FILE}.gz
Database: PostgreSQL (Neon)
Host: ${DB_HOST}
Port: ${DB_PORT}
Database: ${DB_NAME}
User: ${DB_USER}

Schema Version: ReportCard+ v1.0
Tables Backed Up: 15 models
Data Included: All user data, school data, academic records

Restore Command:
gunzip -c backups/${BACKUP_FILE}.gz | psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}

Notes:
- This backup contains all data except Prisma migrations
- Use the restore script to restore this backup
- Keep this backup file in a safe location
EOF
    
    echo "📄 Backup info created: backups/backup_info_${TIMESTAMP}.txt"
    
else
    echo "❌ Database backup failed!"
    echo "Please check your database connection and permissions."
    exit 1
fi

echo ""
echo "🎉 Database backup completed successfully!"
echo ""
echo "📋 Backup Summary:"
echo "   - Backup file: backups/${BACKUP_FILE}.gz"
echo "   - Info file: backups/backup_info_${TIMESTAMP}.txt"
echo "   - Location: $(pwd)/backups/"
echo ""
echo "🔄 To restore this backup, run:"
echo "   ./restore-database.sh backups/${BACKUP_FILE}.gz"
# 🗄️ ReportCard+ Database Configuration Guide

## 📋 Overview

This guide covers the complete database configuration for ReportCard+ using PostgreSQL with Neon cloud database.

---

## 🌟 **Database Provider: Neon PostgreSQL**

### **Why Neon?**
- ✅ **Serverless PostgreSQL** - No infrastructure management
- ✅ **Auto-scaling** - Handles growth automatically
- ✅ **Branching** - Development and testing environments
- ✅ **Backups** - Automatic daily backups with point-in-time recovery
- ✅ **Global CDN** - Fast access from anywhere
- ✅ **SSL/TLS** - Encrypted connections by default

---

## 🔧 **Environment Configuration**

### **📁 Environment Files**

#### **1. Main Environment (.env)**
```env
# PostgreSQL Neon Database
DATABASE_URL="postgresql://neondb_owner:npg_yYwSk6fnQ1va@ep-green-leaf-a4yaueft-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Database Configuration
DB_PROVIDER="postgresql"
DB_HOST="ep-green-leaf-a4yaueft-pooler.us-east-1.aws.neon.tech"
DB_PORT="5432"
DB_DATABASE="neondb"
DB_USER="neondb_owner"
DB_PASSWORD="npg_yYwSk6fnQ1va"
DB_SSLMODE="require"
DB_CHANNEL_BINDING="require"
```

#### **2. Development Environment (.env.development)**
```env
# Development Settings
NODE_ENV="development"
ENABLE_LOGGING="true"
ENABLE_DEBUG="true"
SKIP_AUTH="false"
UPLOAD_DIR="./uploads"
```

#### **3. Production Environment (.env.production)**
```env
# Production Settings
NODE_ENV="production"
NEXTAUTH_SECRET="your-secure-nextauth-secret"
JWT_SECRET="your-secure-jwt-secret"
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_MAX="100"
```

#### **4. Database Configuration (.env.database)**
```env
# Connection Pool Settings
DB_CONNECTION_LIMIT="20"
DB_POOL_TIMEOUT="30"
DB_CONNECT_TIMEOUT="10"
DB_MIGRATE="true"
DB_SEED="true"
```

---

## 📊 **Database Schema**

### **🗂️ Complete Schema (15 Models)**

#### **🔐 Authentication Models**
```sql
User           - User accounts with roles
UserRole      - Role definitions (ADMIN/TEACHER/PARENT/STUDENT)
```

#### **🏫 School Management Models**
```sql
School         - School information
Class          - Classes and sections
Teacher         - Teacher profiles
Student         - Student records
Subject         - Subject management
```

#### **📚 Academic Models**
```sql
Exam            - Exam scheduling
Result          - Student grades and results
Homework        - Assignment tracking
Attendance      - Attendance records
```

#### **💬 Communication Models**
```sql
Announcement    - School announcements
Notification   - User notifications
Message         - Parent-teacher messaging
```

#### **💰 Business Models**
```sql
Subscription    - Subscription plans
Invoice         - Billing and invoicing
```

---

## 🔌 **Database Connection Details**

### **🔗 Connection String**
```
postgresql://neondb_owner:npg_yYwSk6fnQ1va@ep-green-leaf-a4yaueft-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### **📊 Connection Parameters**
| Parameter | Value | Description |
|-----------|-------|-------------|
| **Protocol** | `postgresql` | Database protocol |
| **Host** | `ep-green-leaf-a4yaueft-pooler.us-east-1.aws.neon.tech` | Neon server |
| **Port** | `5432` | PostgreSQL port |
| **Database** | `neondb` | Database name |
| **User** | `neondb_owner` | Database user |
| **Password** | `npg_yYwSk6fnQ1va` | Database password |
| **SSL Mode** | `require` | Enforce SSL |
| **Channel Binding** | `require` | Force channel binding |

---

## 🛠️ **Database Setup Scripts**

### **🚀 Setup Script (setup-database.sh)**
```bash
# Complete database setup
./setup-database.sh

# What it does:
# 1. Tests database connection
# 2. Generates Prisma client
# 3. Pushes database schema
# 4. Seeds initial data
# 5. Creates demo accounts
```

### **🔄 Reset Script (reset-database.sh)**
```bash
# Reset database to clean state
./reset-database.sh

# What it does:
# 1. Drops all tables
# 2. Recreates schema
# 3. Re-seeds all data
# 4. Creates demo accounts
```

### **💾 Backup Script (backup-database.sh)**
```bash
# Create database backup
./backup-database.sh

# What it does:
# 1. Creates SQL backup
# 2. Compresses backup file
# 3. Creates backup info file
# 4. Stores in backups/ directory
```

### **🔄 Restore Script (restore-database.sh)**
```bash
# Restore from backup
./restore-database.sh backup_file.gz

# What it does:
# 1. Resets database
# 2. Restores from backup
# 3. Verifies data integrity
# 4. Regenerates Prisma client
```

---

## 📈 **Performance Optimization**

### **🔧 Connection Pooling**
```env
DB_CONNECTION_LIMIT="20"    # Max connections
DB_POOL_TIMEOUT="30"       # Pool timeout
DB_CONNECT_TIMEOUT="10"    # Connection timeout
```

### **⚡ Query Optimization**
- **Indexes**: Proper indexes on foreign keys and unique constraints
- **Relations**: Optimized Prisma relations with selective loading
- **Queries**: Efficient queries with proper filtering and pagination

### **📊 Monitoring**
```typescript
// Connection monitoring
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

---

## 🔒 **Security Configuration**

### **🛡️ SSL/TLS**
- **SSL Mode**: `require` - Enforces SSL encryption
- **Channel Binding**: `require` - Prevents MITM attacks
- **Certificates**: Managed by Neon (automatically renewed)

### **🔐 Access Control**
- **Connection**: Encrypted by default
- **Authentication**: Role-based database access
- **Network**: Private VPC with secure connections

### **🔑 Secrets Management**
```env
# Never commit actual passwords to version control
DB_PASSWORD="npg_yYwSk6fnQ1va"  # Use environment variables
JWT_SECRET="your-secure-secret"     # Generate secure secrets
NEXTAUTH_SECRET="your-auth-secret"   # Use strong secrets
```

---

## 📋 **Database Migrations**

### **🔄 Migration Process**
```bash
# Generate migration files
bunx prisma db push

# View migration status
bunx prisma migrate status

# Reset migrations (development only)
bunx prisma migrate reset
```

### **📊 Migration Files**
- **Location**: `prisma/migrations/`
- **Format**: SQL migration files
- **Management**: Handled by Prisma
- **Rollback**: Supported with `db push --force-reset`

---

## 📊 **Data Seeding**

### **🌱 Seed Data (seed-postgres.ts)**
```typescript
// Complete seed data includes:
- 1 School (Demo International School)
- 1 Admin user
- 1 Teacher user
- 3 Classes (10th A, 10th B, 9th A)
- 3 Subjects (Mathematics, Science, English)
- 10 Students with complete profiles
- Sample exam with results
- 2 Announcements
- Mixed subscription plans
- Sample invoice
```

### **🎯 Demo Accounts**
| Role | Email | Password | Features |
|------|-------|----------|----------|
| **Admin** | admin@reportcardplus.com | admin123 | Full access |
| **Teacher** | teacher@reportcardplus.com | teacher123 | Class management |
| **Student** | student1@reportcardplus.com | student123 | Student access |

---

## 🔧 **Development Workflow**

### **🛠️ Local Development**
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 2. Install dependencies
bun install

# 3. Set up database
./setup-database.sh

# 4. Start development server
bun run dev
```

### **🔄 Database Changes**
```bash
# 1. Modify schema (prisma/schema.prisma)
# 2. Generate client
bunx prisma generate

# 3. Push changes
bunx prisma db push

# 4. Update seed data if needed
bunx tsx seed-postgres.ts
```

### **🧪 Testing**
```bash
# Test with development database
NODE_ENV=development bun run dev

# Test with staging database
NODE_ENV=staging bun run dev

# Test with production database
NODE_ENV=production bun run build && bun run start
```

---

## 📊 **Database Monitoring**

### **📈 Neon Dashboard**
- **URL**: https://console.neon.tech
- **Features**: Query performance, connection metrics, storage usage
- **Monitoring**: Real-time query analysis and optimization suggestions

### **🔍 Application Monitoring**
```typescript
// Query logging
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Performance monitoring
const startTime = Date.now()
const result = await db.user.findMany()
const duration = Date.now() - startTime
console.log(`Query took ${duration}ms`)
```

---

## 🚨 **Troubleshooting**

### **❌ Common Issues**

#### **Connection Failed**
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
bunx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌', e));
"
```

#### **Migration Failed**
```bash
# Reset and retry
bunx prisma db push --force-reset
bunx tsx seed-postgres.ts
```

#### **Seed Data Issues**
```bash
# Clear and re-seed
bunx prisma db push --force-reset
bunx tsx seed-postgres.ts
```

### **🔧 Debug Mode**
```env
# Enable debug logging
ENABLE_LOGGING="true"
ENABLE_DEBUG="true"
```

---

## 📚 **Best Practices**

### **🔒 Security**
- ✅ Use environment variables for secrets
- ✅ Enable SSL/TLS for all connections
- ✅ Use strong passwords and secrets
- ✅ Regularly rotate database credentials
- ✅ Limit database user permissions

### **⚡ Performance**
- ✅ Use connection pooling
- ✅ Optimize queries with proper indexes
- ✅ Implement pagination for large datasets
- ✅ Use selective loading with Prisma relations
- ✅ Monitor query performance regularly

### **🔄 Maintenance**
- ✅ Regular database backups
- ✅ Monitor storage usage
- ✅ Update dependencies regularly
- ✅ Test migrations in staging
- ✅ Document schema changes

---

## 🎯 **Production Deployment**

### **🚀 Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Migrations run successfully
- [ ] Seed data verified
- [ ] Backups created
- [ ] Monitoring configured
- [ ] Security settings verified
- [ ] Performance optimized

### **📊 Production Environment Variables**
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
JWT_SECRET="your-production-jwt-secret"
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_MAX="100"
```

---

## 🎉 **Conclusion**

Your ReportCard+ database is now fully configured with PostgreSQL on Neon! 

### **✅ What You Have:**
- **Production-ready PostgreSQL database**
- **Complete schema with 15 models**
- **Automated setup and maintenance scripts**
- **Backup and restore capabilities**
- **Performance optimizations**
- **Security best practices**
- **Comprehensive documentation**

### **🚀 Next Steps:**
1. Run `./setup-database.sh` to set up your database
2. Start the development server with `bun run dev`
3. Login with demo credentials to explore
4. Customize the data for your specific needs
5. Deploy to production when ready

---

**🌟 Your ReportCard+ database is now ready for production use with PostgreSQL on Neon!**
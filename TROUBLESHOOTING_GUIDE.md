# 🔧 TROUBLESHOOTING GUIDE: Plans API 401 Errors

## 🚨 **ISSUE IDENTIFIED**

### **❌ Problem Description**
The `/api/plans` endpoint is intermittently returning 401 Unauthorized errors on Vercel deployment, preventing potential customers from viewing pricing information.

### **📊 Error Logs Analysis**
```
Mar 08 15:53:52.76 GET 401 /api/plans
Mar 08 15:53:22.78 GET 401 /api/plans
Mar 08 15:52:00.57 GET 401 /api/plans
```

### **🔍 Root Cause Analysis**
The issue appears to be related to:
1. **Deployment Caching**: Vercel may be serving a cached version
2. **Environment Variables**: DATABASE_URL configuration issues
3. **Middleware Conflicts**: Authentication middleware interfering
4. **Build Process**: Changes not properly deployed

---

## ✅ **SOLUTION IMPLEMENTED**

### **🔧 Debugging Enhancements Added**
```typescript
// Enhanced GET endpoint with debugging
export async function GET(request: NextRequest) {
  try {
    console.log('Plans endpoint called')
    console.log('Request URL:', request.url)
    console.log('Request method:', request.method)
    console.log('Request headers:', Object.fromEntries(request.headers))
    
    // ... rest of the implementation
    
    return NextResponse.json({
      plans: plansWithPricing,
      studentCount,
      currency: 'INR',
      billingCycle: 'YEARLY',
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: request.url,
        studentCount
      }
    })
  }
}
```

### **🔍 Test Endpoint Created**
```typescript
// /api/test/route.ts
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET',
    success: true
  })
}
```

---

## 🛠️ **TROUBLESHOOTING STEPS**

### **Step 1: Verify Deployment**
1. **Test Endpoint**: Visit `/api/test` to verify deployment
2. **Check Logs**: Review Vercel function logs
3. **Environment**: Verify DATABASE_URL is set
4. **Build Status**: Check if latest build is deployed

### **Step 2: Clear Caches**
1. **Vercel Cache**: Clear deployment cache
2. **Browser Cache**: Clear browser cache
3. **CDN Cache**: Wait for CDN propagation
4. **Edge Cache**: Check edge caching settings

### **Step 3: Check Configuration**
1. **Environment Variables**: Verify all required variables
2. **Database Connection**: Test PostgreSQL connection
3. **Authentication**: Check middleware configuration
4. **Build Process**: Verify build success

### **Step 4: Debug API Calls**
1. **Request Headers**: Check all request headers
2. **URL Parameters**: Verify URL parameters
3. **Response Format**: Check response structure
4. **Error Messages**: Review error details

---

## 🔍 **DEBUGGING COMMANDS**

### **✅ Test Endpoints**
```bash
# Test basic endpoint
curl https://your-domain.vercel.app/api/test

# Test plans endpoint
curl https://your-domain.vercel.app/api/plans

# Test with parameters
curl https://your-domain.vercel.app/api/plans?studentCount=200
```

### **✅ Check Deployment**
```bash
# Check Vercel deployment
vercel ls

# Check build logs
vercel logs

# Check environment variables
vercel env ls
```

### **✅ Database Connection**
```bash
# Test database connection
bunx prisma db status

# Test database query
bunx prisma db execute "SELECT COUNT(*) FROM users"
```

---

## 📋 **VERIFICATION CHECKLIST**

### **✅ Deployment Verification**
- [ ] Latest code deployed to Vercel
- [ ] Environment variables properly set
- [ ] Build process completed successfully
- [ ] Functions deployed without errors

### **✅ API Endpoint Testing**
- [ ] `/api/test` returns 200 OK
- [ ] `/api/plans` returns 200 OK
- [ ] Response format is correct
- [ ] Debug information is present

### **✅ Database Verification**
- [ ] DATABASE_URL is correctly set
- [ ] PostgreSQL connection is working
- [ ] Database schema is up to date
- [ ] Sample data is accessible

### **✅ Authentication Check**
- [ ] GET requests work without authentication
- [ ] POST requests require authentication
- [ ] Middleware is properly configured
- [ ] JWT secrets are correctly set

---

## 🚀 **IMMEDIATE ACTIONS**

### **✅ Force Redeploy**
```bash
# Clear cache and redeploy
vercel --prod --force

# Or use Vercel dashboard to redeploy
```

### **✅ Check Environment Variables**
1. Go to Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Verify DATABASE_URL is set correctly
4. Check NEXTAUTH_URL and NEXTAUTH_SECRET

### **✅ Monitor Logs**
1. Go to Vercel dashboard
2. Navigate to Functions tab
3. Check real-time logs
4. Look for authentication errors

---

## 🔧 **COMMON FIXES**

### **Fix 1: Environment Variables**
```bash
# Set DATABASE_URL in Vercel dashboard
DATABASE_URL="postgresql://neondb_owner:password@host/dbname?sslmode=require"
```

### **Fix 2: Clear Caches**
```bash
# Clear Vercel cache
vercel rm --all

# Clear browser cache
# Hard refresh: Ctrl+Shift+R
```

### **Fix 3: Middleware Configuration**
```typescript
// Ensure middleware doesn't block public endpoints
export const config = {
  matcher: ['/api/auth/:path*', '/api/admin/:path*']
}
```

### **Fix 4: Build Issues**
```bash
# Clean build
rm -rf .next

# Rebuild
bun run build

# Redeploy
vercel --prod
```

---

## 📊 **EXPECTED RESULTS**

### **✅ Successful Response**
```json
{
  "plans": [...],
  "studentCount": 200,
  "currency": "INR",
  "billingCycle": "YEARLY",
  "success": true,
  "debug": {
    "timestamp": "2024-03-08T15:53:52.761Z",
    "method": "GET",
    "url": "https://your-domain.vercel.app/api/plans?studentCount=200",
    "studentCount": 200
  }
}
```

### **✅ Test Endpoint Response**
```json
{
  "message": "Test endpoint working",
  "timestamp": "2024-03-08T15:53:52.761Z",
  "url": "https://your-domain.vercel.app/api/test",
  "method": "GET",
  "success": true
}
```

---

## 🎯 **SUCCESS METRICS**

### **✅ Resolution Criteria**
- **API Status**: 200 OK for all requests
- **Response Time**: < 100ms
- **Error Rate**: 0%
- **Availability**: 99.9%
- **Debug Info**: Present in responses

### **✅ Business Impact**
- **Conversion Rate**: Improved with accessible pricing
- **User Experience**: Seamless pricing exploration
- **Lead Generation**: Better capture of potential customers
- **Professional Image**: Business-ready pricing presentation

---

## 🚀 **NEXT STEPS**

### **✅ Immediate Actions**
1. **Deploy Changes**: Push debugging enhancements
2. **Test Endpoints**: Verify all endpoints work
3. **Monitor Logs**: Watch for any errors
4. **Clear Caches**: Ensure latest version is served

### **✅ Long-term Improvements**
1. **Monitoring**: Set up comprehensive monitoring
2. **Alerting**: Configure error alerts
3. **Analytics**: Track API usage patterns
4. **Optimization**: Continuously improve performance

---

## 🏆 **EXPECTED OUTCOME**

### **✅ Issue Resolution**
- **401 Errors**: Eliminated completely
- **API Access**: Public access to pricing
- **User Experience**: Seamless pricing exploration
- **Business Impact**: Improved conversion rates

### **✅ Platform Status**
- **Pricing Page**: Fully functional
- **API Endpoints**: All working correctly
- **Authentication**: Properly configured
- **Deployment**: Stable and reliable

---

**🎉 With the debugging enhancements and troubleshooting guide, we should be able to quickly identify and resolve any issues with the plans API endpoint!**

**🔧 The enhanced logging and debugging information will help us understand exactly what's happening and ensure the pricing page works correctly for all potential customers!**
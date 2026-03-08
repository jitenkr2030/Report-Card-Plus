import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, requireRole } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const authRequest = await authenticate(request)
    if (!authRequest) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    let where: any = {}
    if (schoolId) where.schoolId = schoolId
    if (authRequest.user!.role === 'ADMIN') {
      const admin = await db.user.findUnique({
        where: { id: authRequest.user!.userId },
        include: { teacher: true }
      })
      if (admin?.teacher?.schoolId) {
        where.schoolId = admin.teacher.schoolId
      }
    }

    const subscriptions = await db.subscription.findMany({
      where,
      include: {
        school: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: {
              select: {
                name: true,
                section: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ subscriptions })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authRequest = await authenticate(request)
    if (!authRequest || !requireRole(['ADMIN'])(authRequest)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      schoolId,
      planType,
      studentIds,
      billingCycle = 'YEARLY',
      startDate,
      customPricing
    } = await request.json()

    if (!schoolId || !planType || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan type
    const validPlans = ['BASIC', 'STANDARD', 'PREMIUM']
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Get school information
    const school = await db.school.findUnique({
      where: { id: schoolId }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Calculate pricing
    const pricing = calculatePricing(planType, studentIds.length, customPricing)
    
    // Create subscriptions for each student
    const subscriptions = await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Check if student exists
        const student = await db.student.findUnique({
          where: { id: studentId }
        })

        if (!student) {
          throw new Error(`Student with ID ${studentId} not found`)
        }

        // Calculate subscription dates
        const start = startDate ? new Date(startDate) : new Date()
        const end = new Date(start)
        end.setFullYear(end.getFullYear() + 1) // 1 year from start

        // Create or update subscription
        const existingSubscription = await db.subscription.findFirst({
          where: {
            studentId,
            status: 'ACTIVE'
          }
        })

        if (existingSubscription) {
          return await db.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              planType,
              price: pricing.perStudentPrice,
              billingCycle,
              startDate: start,
              endDate: end,
              features: JSON.stringify(getPlanFeatures(planType)),
              updatedAt: new Date()
            }
          })
        } else {
          return await db.subscription.create({
            data: {
              schoolId,
              studentId,
              planType,
              price: pricing.perStudentPrice,
              billingCycle,
              startDate: start,
              endDate: end,
              status: 'ACTIVE',
              features: JSON.stringify(getPlanFeatures(planType)),
              autoRenew: true
            }
          })
        }
      })
    )

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        schoolId,
        subscriptionIds: JSON.stringify(subscriptions.map(s => s.id)),
        totalAmount: pricing.totalPrice,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        billingCycle,
        planType,
        studentCount: studentIds.length,
        pricing: JSON.stringify(pricing)
      }
    })

    return NextResponse.json({
      message: `Successfully created ${subscriptions.length} subscriptions`,
      subscriptions,
      invoice,
      pricing
    })

  } catch (error) {
    console.error('Error creating subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculatePricing(planType: string, studentCount: number, customPricing?: any) {
  const basePrices = {
    BASIC: 299,
    STANDARD: 499,
    PREMIUM: 899
  }

  const basePrice = customPricing?.[planType] || basePrices[planType as keyof typeof basePrices]
  
  // Volume discounts
  let discount = 0
  if (studentCount >= 500) {
    discount = 0.20 // 20% discount for 500+ students
  } else if (studentCount >= 300) {
    discount = 0.15 // 15% discount for 300+ students
  } else if (studentCount >= 100) {
    discount = 0.10 // 10% discount for 100+ students
  }

  const discountedPrice = basePrice * (1 - discount)
  const totalPrice = discountedPrice * studentCount

  return {
    planType,
    basePrice,
    discountedPrice,
    totalPrice,
    studentCount,
    discount: discount * 100,
    perStudentPrice: discountedPrice
  }
}

function getPlanFeatures(planType: string) {
  const features = {
    BASIC: [
      'Secure login (Student ID / mobile)',
      'View exam results (subject-wise)',
      'View total marks, percentage & grade',
      'Download PDF report card',
      'View teacher remarks',
      'View exam schedule',
      'Enter marks (subject-wise)',
      'Update marks anytime',
      'Add remarks for each student',
      'View class-wise result summary',
      'Create classes & sections',
      'Add students & teachers',
      'Create exams (Unit Test, Mid Term, Final)',
      'Define subjects & maximum marks',
      'Upload marks via dashboard',
      'Auto grade calculation',
      'Generate bulk report cards',
      'Export results to Excel'
    ],
    STANDARD: [
      'All Basic features',
      'Teacher uploads daily homework',
      'Subject-wise homework listing',
      'Attach images / PDFs',
      'Homework history tracking',
      'Push notifications for homework',
      'Push notifications for announcements',
      'Push notifications for exam dates',
      'Push notifications for results',
      'Real-time parent alerts',
      'Direct message system',
      'Class broadcast message',
      'Read/unread tracking',
      'School-wide announcements',
      'Class-specific notices',
      'Holiday notifications',
      'Academic calendar',
      'Exam schedule',
      'Event updates'
    ],
    PREMIUM: [
      'All Standard features',
      'Result published alert',
      'Homework notification',
      'Attendance alerts',
      'Exam reminders',
      'Configurable message limits',
      'Daily student attendance',
      'Present / Absent / Leave marking',
      'Monthly attendance report',
      'Parent attendance view',
      'Auto alerts for absentees',
      'Student performance trends',
      'Subject-wise analysis',
      'Weak subject identification',
      'Class toppers list',
      'Rank calculation',
      'Comparison with previous exams',
      'Class performance report',
      'Teacher performance insights',
      'Pass/fail ratio',
      'Subject performance stats',
      'Priority support',
      'Fast onboarding',
      'Priority issue resolution',
      'Dedicated support channel'
    ]
  }

  return features[planType as keyof typeof features] || []
}
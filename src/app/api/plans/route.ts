import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required for GET requests
    // This allows potential customers to view pricing without logging in

    const { searchParams } = new URL(request.url)
    const studentCount = parseInt(searchParams.get('studentCount') || '1')

    // Define pricing tiers
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 299,
        billingCycle: 'YEARLY',
        description: 'Digital Result & Report Card System',
        features: [
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
        limitations: [
          'No homework management',
          'No notifications',
          'No messaging',
          'No attendance tracking',
          'No analytics'
        ],
        popular: false,
        color: 'blue'
      },
      {
        id: 'standard',
        name: 'Standard Plan',
        price: 499,
        billingCycle: 'YEARLY',
        description: 'Daily School Communication System',
        features: [
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
        limitations: [
          'No attendance management',
          'No advanced analytics',
          'No WhatsApp alerts',
          'No priority support'
        ],
        popular: true,
        color: 'green'
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 899,
        billingCycle: 'YEARLY',
        description: 'Smart School Automation System',
        features: [
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
        ],
        limitations: [],
        popular: false,
        color: 'purple'
      }
    ]

    // Calculate pricing with volume discounts
    const plansWithPricing = plans.map(plan => {
      let discount = 0
      let discountLabel = ''

      if (studentCount >= 500) {
        discount = 0.20
        discountLabel = '20% Volume Discount'
      } else if (studentCount >= 300) {
        discount = 0.15
        discountLabel = '15% Volume Discount'
      } else if (studentCount >= 100) {
        discount = 0.10
        discountLabel = '10% Volume Discount'
      }

      const discountedPrice = plan.price * (1 - discount)
      const totalPrice = discountedPrice * studentCount

      return {
        ...plan,
        pricing: {
          basePrice: plan.price,
          discountedPrice: Math.round(discountedPrice),
          totalPrice: Math.round(totalPrice),
          studentCount,
          discount: Math.round(discount * 100),
          discountLabel,
          savings: Math.round((plan.price - discountedPrice) * studentCount)
        }
      }
    })

    return NextResponse.json({
      plans: plansWithPricing,
      studentCount,
      currency: 'INR',
      billingCycle: 'YEARLY',
      success: true
    })

  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch pricing plans',
        plans: [],
        studentCount: 1,
        currency: 'INR',
        billingCycle: 'YEARLY',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authRequest = await authenticate(request)
    if (!authRequest) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      planId,
      studentCount,
      customizations
    } = await request.json()

    if (!planId || !studentCount) {
      return NextResponse.json(
        { error: 'Plan ID and student count are required' },
        { status: 400 }
      )
    }

    // Get plan details
    const plans = await GET(request)
    const planData = await plans.json()
    const plan = planData.plans.find((p: any) => p.id === planId)

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Calculate custom pricing if provided
    let pricing = plan.pricing
    if (customizations) {
      pricing = {
        ...pricing,
        ...customizations,
        totalPrice: (customizations.discountedPrice || pricing.discountedPrice) * studentCount
      }
    }

    // Generate quote
    const quote = {
      id: `QUOTE-${Date.now()}`,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description
      },
      pricing,
      features: plan.features,
      limitations: plan.limitations,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      generatedAt: new Date().toISOString(),
      generatedBy: authRequest.user!.name
    }

    return NextResponse.json({ quote })

  } catch (error) {
    console.error('Error generating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
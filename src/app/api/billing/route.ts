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
    const status = searchParams.get('status')

    let where: any = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status.toUpperCase()
    
    if (authRequest.user!.role === 'ADMIN') {
      const admin = await db.user.findUnique({
        where: { id: authRequest.user!.userId },
        include: { teacher: true }
      })
      if (admin?.teacher?.schoolId) {
        where.schoolId = admin.teacher.schoolId
      }
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        school: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse JSON fields
    const invoicesWithParsedData = invoices.map(invoice => ({
      ...invoice,
      subscriptionIds: JSON.parse(invoice.subscriptionIds),
      pricing: JSON.parse(invoice.pricing)
    }))

    return NextResponse.json({ invoices: invoicesWithParsedData })

  } catch (error) {
    console.error('Error fetching invoices:', error)
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
      subscriptionIds,
      totalAmount,
      billingCycle,
      planType,
      studentCount,
      pricing,
      dueDate
    } = await request.json()

    if (!schoolId || !subscriptionIds || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        schoolId,
        subscriptionIds: JSON.stringify(subscriptionIds),
        totalAmount,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billingCycle: billingCycle || 'YEARLY',
        planType,
        studentCount,
        pricing: JSON.stringify(pricing)
      }
    })

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
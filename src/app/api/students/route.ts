import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, requireRole } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const authRequest = await authenticate(request)
    if (!authRequest || !requireRole(['ADMIN', 'TEACHER'])(authRequest)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = classId ? { classId } : {}

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            }
          },
          class: {
            select: {
              name: true,
              section: true,
            }
          },
          results: {
            include: {
              exam: {
                select: {
                  name: true,
                  type: true,
                }
              },
              subject: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          rollNumber: 'asc'
        },
        skip,
        take: limit,
      }),
      db.student.count({ where })
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
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
      name,
      email,
      phone,
      rollNumber,
      admissionNo,
      classId,
      dateOfBirth,
      gender,
      address,
      parentName,
      parentPhone,
      parentEmail,
      password = 'student123'
    } = await request.json()

    if (!name || !rollNumber || !admissionNo || !classId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if admission number already exists
    const existingStudent = await db.student.findUnique({
      where: { admissionNo }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Admission number already exists' },
        { status: 400 }
      )
    }

    // Check if roll number already exists in the class
    const existingRollNumber = await db.student.findFirst({
      where: { rollNumber, classId }
    })

    if (existingRollNumber) {
      return NextResponse.json(
        { error: 'Roll number already exists in this class' },
        { status: 400 }
      )
    }

    // Get school info
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: { school: true }
    })

    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Hash password
    const { hashPassword } = await import('@/lib/auth')
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: email || `${name.toLowerCase().replace(' ', '.')}@school.com`,
        password: hashedPassword,
        role: 'STUDENT',
        phone,
      }
    })

    // Create student
    const student = await db.student.create({
      data: {
        userId: user.id,
        rollNumber,
        admissionNo,
        name,
        email: user.email,
        phone,
        classId,
        schoolId: classInfo.schoolId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        parentName,
        parentPhone,
        parentEmail,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        class: {
          select: {
            name: true,
            section: true,
          }
        }
      }
    })

    // Update user with student ID
    await db.user.update({
      where: { id: user.id },
      data: { studentId: student.id }
    })

    return NextResponse.json({
      message: 'Student created successfully',
      student
    })

  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
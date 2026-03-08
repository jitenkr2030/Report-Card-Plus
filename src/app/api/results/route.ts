import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, requireRole } from '@/middleware/auth'
import { calculateGrade, calculatePercentage } from '@/lib/auth'

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
    const studentId = searchParams.get('studentId')
    const examId = searchParams.get('examId')
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')

    // Build where clause based on user role and parameters
    let where: any = {}

    if (authRequest.user!.role === 'STUDENT' || authRequest.user!.role === 'PARENT') {
      // Students/Parents can only see their own results
      const student = await db.student.findUnique({
        where: { userId: authRequest.user!.userId }
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    if (examId) where.examId = examId
    if (classId) where.classId = classId
    if (subjectId) where.subjectId = subjectId

    const results = await db.result.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            },
            class: {
              select: {
                name: true,
                section: true,
              }
            }
          }
        },
        exam: {
          select: {
            name: true,
            type: true,
            startDate: true,
            status: true,
          }
        },
        subject: {
          select: {
            name: true,
            code: true,
            maxMarks: true,
          }
        }
      },
      orderBy: [
        { exam: { startDate: 'desc' } },
        { subject: { name: 'asc' } }
      ]
    })

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authRequest = await authenticate(request)
    if (!authRequest || !requireRole(['ADMIN', 'TEACHER'])(authRequest)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      studentId,
      examId,
      subjectId,
      marksObtained,
      maxMarks,
      remarks
    } = await request.json()

    if (!studentId || !examId || !subjectId || marksObtained === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get subject info for max marks if not provided
    let finalMaxMarks = maxMarks
    if (!finalMaxMarks) {
      const subject = await db.subject.findUnique({
        where: { id: subjectId }
      })
      if (subject) {
        finalMaxMarks = subject.maxMarks
      }
    }

    // Calculate percentage and grade
    const percentage = calculatePercentage(marksObtained, finalMaxMarks)
    const grade = calculateGrade(percentage)

    // Check if result already exists
    const existingResult = await db.result.findUnique({
      where: {
        studentId_examId_subjectId: {
          studentId,
          examId,
          subjectId
        }
      }
    })

    let result
    if (existingResult) {
      // Update existing result
      result = await db.result.update({
        where: { id: existingResult.id },
        data: {
          marksObtained,
          maxMarks: finalMaxMarks,
          percentage,
          grade,
          remarks,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
          exam: {
            select: {
              name: true,
              type: true,
            }
          },
          subject: {
            select: {
              name: true,
              code: true,
            }
          }
        }
      })
    } else {
      // Create new result
      result = await db.result.create({
        data: {
          studentId,
          examId,
          subjectId,
          marksObtained,
          maxMarks: finalMaxMarks,
          percentage,
          grade,
          remarks,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
          exam: {
            select: {
              name: true,
              type: true,
            }
          },
          subject: {
            select: {
              name: true,
              code: true,
            }
          }
        }
      })
    }

    return NextResponse.json({
      message: existingResult ? 'Result updated successfully' : 'Result created successfully',
      result
    })

  } catch (error) {
    console.error('Error saving result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
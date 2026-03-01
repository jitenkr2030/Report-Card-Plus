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
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const skip = (page - 1) * limit

    let where: any = {}

    // Build where clause based on user role
    if (authRequest.user!.role === 'STUDENT' || authRequest.user!.role === 'PARENT') {
      // Students/Parents can only see their own attendance
      const student = await db.student.findUnique({
        where: { userId: authRequest.user!.userId }
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    if (classId) where.classId = classId
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.date = {
        gte: startDate,
        lt: endDate
      }
    }
    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const [attendance, total] = await Promise.all([
      db.attendance.findMany({
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
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit,
      }),
      db.attendance.count({ where })
    ])

    return NextResponse.json({
      attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching attendance:', error)
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
      studentIds,
      date,
      status,
      remarks
    } = await request.json()

    if (!studentIds || !Array.isArray(studentIds) || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get teacher info
    const teacher = await db.teacher.findUnique({
      where: { userId: authRequest.user!.userId }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const attendanceDate = new Date(date)
    const results = []

    for (const studentId of studentIds) {
      // Check if attendance already exists for this student and date
      const existingAttendance = await db.attendance.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: attendanceDate
          }
        }
      })

      // Get student info for classId
      const student = await db.student.findUnique({
        where: { id: studentId }
      })

      if (!student) continue

      let attendanceRecord
      if (existingAttendance) {
        // Update existing attendance
        attendanceRecord = await db.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: status.toUpperCase(),
            remarks,
            teacherId: teacher.id,
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
            }
          }
        })
      } else {
        // Create new attendance record
        attendanceRecord = await db.attendance.create({
          data: {
            studentId,
            classId: student.classId,
            teacherId: teacher.id,
            date: attendanceDate,
            status: status.toUpperCase(),
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
            }
          }
        })
      }

      results.push(attendanceRecord)
    }

    return NextResponse.json({
      message: `Attendance marked for ${results.length} students`,
      attendance: results
    })

  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
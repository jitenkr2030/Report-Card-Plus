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
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let where: any = {}

    // Build where clause based on user role
    if (authRequest.user!.role === 'STUDENT' || authRequest.user!.role === 'PARENT') {
      // Students/Parents can only see their own homework
      const student = await db.student.findUnique({
        where: { userId: authRequest.user!.userId }
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (authRequest.user!.role === 'TEACHER') {
      // Teachers can see homework they assigned
      const teacher = await db.teacher.findUnique({
        where: { userId: authRequest.user!.userId }
      })
      if (teacher) {
        where.teacherId = teacher.id
      }
      if (classId) where.classId = classId
      if (subjectId) where.subjectId = subjectId
    } else if (authRequest.user!.role === 'ADMIN') {
      // Admins can see all homework
      if (classId) where.classId = classId
      if (subjectId) where.subjectId = subjectId
      if (studentId) where.studentId = studentId
    }

    const [homework, total] = await Promise.all([
      db.homework.findMany({
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
          subject: {
            select: {
              name: true,
              code: true,
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
          },
          class: {
            select: {
              name: true,
              section: true,
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        skip,
        take: limit,
      }),
      db.homework.count({ where })
    ])

    return NextResponse.json({
      homework,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching homework:', error)
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
      title,
      description,
      classId,
      subjectId,
      dueDate,
      attachments,
      // For individual student homework
      studentId
    } = await request.json()

    if (!title || !classId || !subjectId || !dueDate) {
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

    // If no specific student, create homework for all students in the class
    if (!studentId) {
      const students = await db.student.findMany({
        where: { classId }
      })

      const homeworkAssignments = await Promise.all(
        students.map(student =>
          db.homework.create({
            data: {
              title,
              description,
              attachments: attachments ? JSON.stringify(attachments) : null,
              dueDate: new Date(dueDate),
              classId,
              subjectId,
              teacherId: teacher.id,
              studentId: student.id,
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
              subject: {
                select: {
                  name: true,
                  code: true,
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
        )
      )

      return NextResponse.json({
        message: `Homework assigned to ${students.length} students successfully`,
        homework: homeworkAssignments
      })
    } else {
      // Create homework for specific student
      const homework = await db.homework.create({
        data: {
          title,
          description,
          attachments: attachments ? JSON.stringify(attachments) : null,
          dueDate: new Date(dueDate),
          classId,
          subjectId,
          teacherId: teacher.id,
          studentId,
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
          subject: {
            select: {
              name: true,
              code: true,
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

      return NextResponse.json({
        message: 'Homework assigned successfully',
        homework
      })
    }

  } catch (error) {
    console.error('Error creating homework:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
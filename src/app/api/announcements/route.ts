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
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    let where: any = {
      isActive: true
    }
    if (type) where.type = type.toUpperCase()

    // Get user's school if not admin
    if (authRequest.user!.role !== 'ADMIN') {
      let schoolId
      if (authRequest.user!.role === 'TEACHER') {
        const teacher = await db.teacher.findUnique({
          where: { userId: authRequest.user!.userId }
        })
        schoolId = teacher?.schoolId
      } else if (authRequest.user!.role === 'STUDENT' || authRequest.user!.role === 'PARENT') {
        const student = await db.student.findUnique({
          where: { userId: authRequest.user!.userId }
        })
        schoolId = student?.schoolId
      }
      if (schoolId) where.schoolId = schoolId
    }

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        include: {
          school: {
            select: {
              name: true,
              logo: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      db.announcement.count({ where })
    ])

    // Parse attachments JSON
    const announcementsWithParsedAttachments = announcements.map(announcement => ({
      ...announcement,
      attachments: announcement.attachments ? JSON.parse(announcement.attachments) : []
    }))

    return NextResponse.json({
      announcements: announcementsWithParsedAttachments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching announcements:', error)
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
      content,
      type = 'GENERAL',
      attachments,
      schoolId
    } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Get school ID based on user role
    let targetSchoolId = schoolId
    if (!targetSchoolId) {
      if (authRequest.user!.role === 'ADMIN') {
        // Admin can post to any school, but if not specified, get first school
        const school = await db.school.findFirst()
        targetSchoolId = school?.id
      } else if (authRequest.user!.role === 'TEACHER') {
        const teacher = await db.teacher.findUnique({
          where: { userId: authRequest.user!.userId }
        })
        targetSchoolId = teacher?.schoolId
      }
    }

    if (!targetSchoolId) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: type.toUpperCase(),
        attachments: attachments && attachments.length > 0 ? JSON.stringify(attachments) : null,
        schoolId: targetSchoolId,
      },
      include: {
        school: {
          select: {
            name: true,
            logo: true,
          }
        }
      }
    })

    // Create notifications for all users in the school
    if (type.toUpperCase() === 'URGENT' || type.toUpperCase() === 'EXAM' || type.toUpperCase() === 'RESULT') {
      const users = await db.user.findMany({
        where: {
          OR: [
            {
              student: {
                schoolId: targetSchoolId
              }
            },
            {
              teacher: {
                schoolId: targetSchoolId
              }
            }
          ]
        }
      })

      await Promise.all(
        users.map(user =>
          db.notification.create({
            data: {
              title,
              message: content,
              type: 'ANNOUNCEMENT',
              userId: user.id,
              announcementId: announcement.id,
            }
          })
        )
      )
    }

    const responseAnnouncement = {
      ...announcement,
      attachments: announcement.attachments ? JSON.parse(announcement.attachments) : []
    }

    return NextResponse.json({
      message: 'Announcement created successfully',
      announcement: responseAnnouncement
    })

  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
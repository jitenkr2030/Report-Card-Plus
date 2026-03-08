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
    const examId = searchParams.get('examId')

    if (!studentId || !examId) {
      return NextResponse.json(
        { error: 'Student ID and Exam ID are required' },
        { status: 400 }
      )
    }

    // Check permissions
    if (authRequest.user!.role === 'STUDENT' || authRequest.user!.role === 'PARENT') {
      const student = await db.student.findUnique({
        where: { userId: authRequest.user!.userId }
      })
      if (!student || student.id !== studentId) {
        return NextResponse.json(
          { error: 'Unauthorized to view this report card' },
          { status: 403 }
        )
      }
    }

    // Get student information
    const student = await db.student.findUnique({
      where: { id: studentId },
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
            academicYear: true,
          }
        },
        school: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get exam information
    const exam = await db.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Get results for this student and exam
    const results = await db.result.findMany({
      where: {
        studentId,
        examId
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
            maxMarks: true,
            passMarks: true,
          }
        }
      },
      orderBy: {
        subject: { name: 'asc' }
      }
    })

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No results found for this exam' },
        { status: 404 }
      )
    }

    // Calculate totals and percentages
    const totalMarksObtained = results.reduce((sum, result) => sum + result.marksObtained, 0)
    const totalMaxMarks = results.reduce((sum, result) => sum + result.maxMarks, 0)
    const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 100) / 100 : 0
    const overallGrade = overallPercentage >= 90 ? 'A+' : 
                        overallPercentage >= 80 ? 'A' : 
                        overallPercentage >= 70 ? 'B+' : 
                        overallPercentage >= 60 ? 'B' : 
                        overallPercentage >= 50 ? 'C+' : 
                        overallPercentage >= 40 ? 'C' : 
                        overallPercentage >= 35 ? 'D' : 'F'

    // Count subjects by grade
    const gradeCounts = results.reduce((acc, result) => {
      acc[result.grade] = (acc[result.grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get attendance summary (if available)
    const attendanceSummary = await db.attendance.groupBy({
      by: ['status'],
      where: {
        studentId,
        date: {
          gte: exam.startDate,
          lte: exam.endDate
        }
      },
      _count: true
    })

    const totalAttendanceDays = attendanceSummary.reduce((sum, record) => sum + record._count, 0)
    const presentDays = attendanceSummary.find(record => record.status === 'PRESENT')?._count || 0
    const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

    // Generate report card data
    const reportCard = {
      school: student.school,
      student: {
        name: student.user.name,
        rollNumber: student.rollNumber,
        admissionNo: student.admissionNo,
        class: `${student.class.name} ${student.class.section || ''}`,
        academicYear: student.class.academicYear,
        dateOfBirth: student.dateOfBirth,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
      },
      exam: {
        name: exam.name,
        type: exam.type,
        startDate: exam.startDate,
        endDate: exam.endDate,
      },
      results: results.map(result => ({
        subject: result.subject.name,
        code: result.subject.code,
        maxMarks: result.maxMarks,
        marksObtained: result.marksObtained,
        percentage: result.percentage,
        grade: result.grade,
        remarks: result.remarks,
        passMarks: result.subject.passMarks,
        status: result.marksObtained >= result.subject.passMarks ? 'PASS' : 'FAIL'
      })),
      summary: {
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        overallGrade,
        gradeCounts,
        attendance: {
          totalDays: totalAttendanceDays,
          presentDays,
          percentage: attendancePercentage
        }
      },
      generatedAt: new Date().toISOString(),
      generatedBy: authRequest.user!.name
    }

    return NextResponse.json({ reportCard })

  } catch (error) {
    console.error('Error generating report card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
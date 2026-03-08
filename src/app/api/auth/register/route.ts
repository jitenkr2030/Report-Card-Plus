import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone, schoolName } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create or find school
    let school
    if (role === 'ADMIN' && schoolName) {
      school = await db.school.create({
        data: {
          name: schoolName,
          email: email,
        }
      })
    } else if (role !== 'ADMIN') {
      // For non-admin users, get the first school (in production, you'd have a better way)
      school = await db.school.findFirst()
      if (!school) {
        return NextResponse.json(
          { error: 'No school found. Please contact administrator.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'School name is required for admin registration' },
        { status: 400 }
      )
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        phone,
      },
      include: {
        student: true,
        teacher: true,
      }
    })

    // Create role-specific profile
    if (role === 'TEACHER') {
      await db.teacher.create({
        data: {
          userId: user.id,
          employeeId: `EMP${Date.now()}`,
          name: user.name,
          email: user.email,
          phone: user.phone,
          schoolId: school.id,
          subjects: '[]', // JSON string
        }
      })

      // Update user with teacher ID
      await db.user.update({
        where: { id: user.id },
        data: { teacherId: user.id }
      })
    } else if (role === 'STUDENT') {
      // For demo, create a default class
      let defaultClass = await db.class.findFirst({
        where: { schoolId: school.id }
      })
      
      if (!defaultClass) {
        defaultClass = await db.class.create({
          data: {
            name: '10th Grade',
            section: 'A',
            schoolId: school.id,
            academicYear: '2024-2025',
          }
        })
      }

      const student = await db.student.create({
        data: {
          userId: user.id,
          rollNumber: `STU${Date.now()}`,
          admissionNo: `ADM${Date.now()}`,
          name: user.name,
          email: user.email,
          phone: user.phone,
          schoolId: school.id,
          classId: defaultClass.id,
        }
      })

      // Update user with student ID
      await db.user.update({
        where: { id: user.id },
        data: { studentId: student.id }
      })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
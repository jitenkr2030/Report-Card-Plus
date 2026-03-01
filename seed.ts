import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth'

const db = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create a demo school
  let school = await db.school.findFirst()
  if (!school) {
    school = await db.school.create({
      data: {
        name: 'Demo International School',
        email: 'demo@school.com',
        phone: '+1234567890',
        address: '123 Education Street, Learning City',
        established: new Date('2000-01-01'),
      },
    })
  }

  console.log('Created school:', school.name)

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await db.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      name: 'School Administrator',
      email: 'admin@school.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1234567891',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create classes
  const class10A = await db.class.upsert({
    where: { 
      schoolId_name_section: {
        schoolId: school.id,
        name: '10th Grade',
        section: 'A'
      }
    },
    update: {},
    create: {
      name: '10th Grade',
      section: 'A',
      schoolId: school.id,
      academicYear: '2024-2025',
      capacity: 40,
    },
  })

  const class10B = await db.class.upsert({
    where: { 
      schoolId_name_section: {
        schoolId: school.id,
        name: '10th Grade',
        section: 'B'
      }
    },
    update: {},
    create: {
      name: '10th Grade',
      section: 'B',
      schoolId: school.id,
      academicYear: '2024-2025',
      capacity: 40,
    },
  })

  const class9A = await db.class.upsert({
    where: { 
      schoolId_name_section: {
        schoolId: school.id,
        name: '9th Grade',
        section: 'A'
      }
    },
    update: {},
    create: {
      name: '9th Grade',
      section: 'A',
      schoolId: school.id,
      academicYear: '2024-2025',
      capacity: 35,
    },
  })

  console.log('Created classes')

  // Create teacher
  const teacherPassword = await hashPassword('teacher123')
  const teacher = await db.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'teacher@school.com',
      password: teacherPassword,
      role: 'TEACHER',
      phone: '+1234567892',
    },
  })

  const teacherProfile = await db.teacher.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      userId: teacher.id,
      employeeId: 'EMP001',
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      schoolId: school.id,
      qualification: 'M.Sc Mathematics',
      experience: 10,
      subjects: JSON.stringify(['Mathematics', 'Physics']),
      joiningDate: new Date('2020-01-01'),
    },
  })

  // Update user with teacher ID
  await db.user.update({
    where: { id: teacher.id },
    data: { teacherId: teacherProfile.id }
  })

  console.log('Created teacher:', teacher.email)

  // Create subjects for 10th Grade A
  const existingSubjects = await db.subject.findMany({
    where: { classId: class10A.id }
  })

  let mathSubject, scienceSubject, englishSubject
  if (existingSubjects.length === 0) {
    mathSubject = await db.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Mathematics for 10th Grade',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })

    scienceSubject = await db.subject.create({
      data: {
        name: 'Science',
        code: 'SCI101',
        description: 'General Science for 10th Grade',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })

    englishSubject = await db.subject.create({
      data: {
        name: 'English',
        code: 'ENG101',
        description: 'English Language and Literature',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })
  } else {
    mathSubject = existingSubjects.find(s => s.name === 'Mathematics')
    scienceSubject = existingSubjects.find(s => s.name === 'Science')
    englishSubject = existingSubjects.find(s => s.name === 'English')
  }

  console.log('Created subjects')

  // Create students
  const studentPassword = await hashPassword('student123')
  const studentNames = [
    'Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Prince', 
    'Edward Norton', 'Fiona Green', 'George Miller', 'Helen Troy'
  ]

  for (let i = 0; i < studentNames.length; i++) {
    const email = `student${i + 1}@school.com`
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    
    if (existingUser) continue

    const studentUser = await db.user.create({
      data: {
        name: studentNames[i],
        email,
        password: studentPassword,
        role: 'STUDENT',
        phone: `+123456789${i + 3}`,
      },
    })

    const student = await db.student.create({
      data: {
        userId: studentUser.id,
        rollNumber: `STU00${i + 1}`,
        admissionNo: `ADM202400${i + 1}`,
        name: studentNames[i],
        email: studentUser.email,
        phone: studentUser.phone,
        schoolId: school.id,
        classId: class10A.id,
        dateOfBirth: new Date(`2008-0${(i % 12) + 1}-15`),
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        parentName: `Parent of ${studentNames[i]}`,
        parentPhone: `+123456780${i + 1}`,
      },
    })

    // Update user with student ID
    await db.user.update({
      where: { id: studentUser.id },
      data: { studentId: student.id }
    })
  }

  console.log('Created students')

  // Create an exam
  const exam = await db.exam.create({
    data: {
      name: 'Unit Test 1',
      type: 'UNIT_TEST',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-05'),
      maxMarks: 100,
      status: 'COMPLETED',
      description: 'First unit test for the academic year',
      isPublished: true,
      schoolId: school.id,
      classId: class10A.id,
    },
  })

  console.log('Created exam:', exam.name)

  // Create some sample results
  const students = await db.student.findMany({
    where: { classId: class10A.id },
    take: 5
  })

  for (const student of students) {
    // Math result
    const mathMarks = Math.floor(Math.random() * 30) + 70 // 70-100
    await db.result.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        subjectId: mathSubject.id,
        marksObtained: mathMarks,
        maxMarks: 100,
        percentage: mathMarks,
        grade: mathMarks >= 90 ? 'A+' : mathMarks >= 80 ? 'A' : mathMarks >= 70 ? 'B+' : 'B',
        remarks: mathMarks >= 80 ? 'Excellent work!' : 'Good effort, keep improving!',
      },
    })

    // Science result
    const scienceMarks = Math.floor(Math.random() * 35) + 65 // 65-100
    await db.result.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        subjectId: scienceSubject.id,
        marksObtained: scienceMarks,
        maxMarks: 100,
        percentage: scienceMarks,
        grade: scienceMarks >= 90 ? 'A+' : scienceMarks >= 80 ? 'A' : scienceMarks >= 70 ? 'B+' : 'B',
        remarks: scienceMarks >= 80 ? 'Outstanding performance!' : 'Good progress!',
      },
    })

    // English result
    const englishMarks = Math.floor(Math.random() * 25) + 75 // 75-100
    await db.result.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        subjectId: englishSubject.id,
        marksObtained: englishMarks,
        maxMarks: 100,
        percentage: englishMarks,
        grade: englishMarks >= 90 ? 'A+' : englishMarks >= 80 ? 'A' : englishMarks >= 70 ? 'B+' : 'B',
        remarks: englishMarks >= 85 ? 'Excellent language skills!' : 'Keep practicing!',
      },
    })
  }

  console.log('Created sample results')

  // Create some announcements
  await db.announcement.create({
    data: {
      title: 'Welcome to New Academic Year',
      content: 'We are excited to welcome all students to the 2024-2025 academic year. Let\'s make it a great year of learning and growth!',
      type: 'GENERAL',
      schoolId: school.id,
    },
  })

  await db.announcement.create({
    data: {
      title: 'Unit Test Schedule',
      content: 'Unit tests will be conducted from August 1st to August 5th. Please prepare well and revise all topics covered.',
      type: 'EXAM',
      schoolId: school.id,
    },
  })

  console.log('Created announcements')

  // Create sample subscriptions for all students
  const allStudents = await db.student.findMany()
  const existingSubscriptions = await db.subscription.findMany({
    where: { studentId: { in: allStudents.map(s => s.id) } }
  })

  const studentsWithoutSubscriptions = allStudents.filter(
    student => !existingSubscriptions.some(sub => sub.studentId === student.id)
  )

  if (studentsWithoutSubscriptions.length === 0) {
    console.log('Subscriptions already exist for all students')
  } else {
    const basicPlanStudents = studentsWithoutSubscriptions.slice(0, 3)
    const standardPlanStudents = studentsWithoutSubscriptions.slice(3, 6)
    const premiumPlanStudents = studentsWithoutSubscriptions.slice(6, 9)

    // Basic Plan subscriptions
    for (const student of basicPlanStudents) {
      await db.subscription.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          planType: 'BASIC',
          price: 299,
          billingCycle: 'YEARLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          features: JSON.stringify([
            'Secure login (Student ID / mobile)',
            'View exam results (subject-wise)',
            'View total marks, percentage & grade',
            'Download PDF report card',
            'View teacher remarks',
            'View exam schedule'
          ]),
          autoRenew: true
        }
      })
    }

    // Standard Plan subscriptions
    for (const student of standardPlanStudents) {
      await db.subscription.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          planType: 'STANDARD',
          price: 499,
          billingCycle: 'YEARLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          features: JSON.stringify([
            'All Basic features',
            'Teacher uploads daily homework',
            'Subject-wise homework listing',
            'Push notifications for homework',
            'Direct message system',
            'School-wide announcements'
          ]),
          autoRenew: true
        }
      })
    }

    // Premium Plan subscriptions
    for (const student of premiumPlanStudents) {
      await db.subscription.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          planType: 'PREMIUM',
          price: 899,
          billingCycle: 'YEARLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          features: JSON.stringify([
            'All Standard features',
            'Daily student attendance',
            'Student performance trends',
            'Class performance report',
            'Priority support',
            'Dedicated support channel'
          ]),
          autoRenew: true
        }
      })
    }

    console.log('Created sample subscriptions')
  }

  // Create sample invoice
  await db.invoice.create({
    data: {
      schoolId: school.id,
      subscriptionIds: JSON.stringify(allStudents.map(s => s.id)),
      totalAmount: 4990, // Mixed plan pricing
      status: 'PAID',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      transactionId: 'TXN' + Date.now(),
      billingCycle: 'YEARLY',
      planType: 'STANDARD', // Use a valid enum value
      studentCount: allStudents.length,
      pricing: JSON.stringify({
        basic: { students: 3, price: 299 },
        standard: { students: 3, price: 499 },
        premium: { students: 2, price: 899 }
      })
    }
  })

  console.log('Created sample subscriptions and invoices')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
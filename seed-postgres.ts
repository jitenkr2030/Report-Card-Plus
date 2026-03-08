import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth'

const db = new PrismaClient()

async function main() {
  console.log('🚀 Starting PostgreSQL database setup for ReportCard+...')
  
  try {
    // Test database connection
    await db.$connect()
    console.log('✅ Database connection successful')
    
    // Create school
    console.log('📚 Creating school...')
    let school = await db.school.findFirst()
    if (!school) {
      school = await db.school.create({
        data: {
          name: 'Demo International School',
          email: 'demo@reportcardplus.com',
          phone: '+91-9876543210',
          address: '123 Education Street, Learning City, State 123456, India',
          established: new Date('2000-01-01'),
        },
      })
    }
    console.log(`✅ School created: ${school.name}`)

    // Create admin user
    console.log('👤 Creating admin user...')
    const adminPassword = await hashPassword('admin123')
    let admin = await db.user.findFirst({ where: { email: 'admin@reportcardplus.com' } })
    if (!admin) {
      admin = await db.user.create({
        data: {
          name: 'School Administrator',
          email: 'admin@reportcardplus.com',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+91-9876543211',
        },
      })
    }
    console.log(`✅ Admin user created: ${admin.email}`)

    // Create teacher
    console.log('👨‍🏫 Creating teacher...')
    const teacherPassword = await hashPassword('teacher123')
    let teacher = await db.user.findFirst({ where: { email: 'teacher@reportcardplus.com' } })
    if (!teacher) {
      teacher = await db.user.create({
        data: {
          name: 'John Smith',
          email: 'teacher@reportcardplus.com',
          password: teacherPassword,
          role: 'TEACHER',
          phone: '+91-9876543212',
        },
      })
    }
    
    let teacherProfile = await db.teacher.findFirst({ where: { email: 'teacher@reportcardplus.com' } })
    if (!teacherProfile) {
      teacherProfile = await db.teacher.create({
        data: {
          userId: teacher.id,
          employeeId: 'EMP001',
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          schoolId: school.id,
          qualification: 'M.Sc Mathematics, B.Ed',
          experience: 10,
          subjects: JSON.stringify(['Mathematics', 'Physics', 'Computer Science']),
          joiningDate: new Date('2020-01-01'),
        },
      })
    }
        userId: teacher.id,
        employeeId: 'EMP001',
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        schoolId: school.id,
        qualification: 'M.Sc Mathematics, B.Ed',
        experience: 10,
        subjects: JSON.stringify(['Mathematics', 'Physics', 'Chemistry']),
        joiningDate: new Date('2020-01-01'),
      },
    })
    
    // Update user with teacher ID
    await db.user.update({
      where: { id: teacher.id },
      data: { teacherId: teacherProfile.id }
    })
    console.log(`✅ Teacher created: ${teacher.email}`)

    // Create classes
    console.log('🏫 Creating classes...')
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
        classTeacherId: teacherProfile.id,
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
        classTeacherId: teacherProfile.id,
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
        classTeacherId: teacherProfile.id,
      },
    })
    console.log('✅ Classes created: 10th A, 10th B, 9th A')

    // Create subjects
    console.log('📚 Creating subjects...')
    const mathSubject = await db.subject.upsert({
      where: { 
        classId_code: {
          classId: class10A.id,
          code: 'MATH101'
        }
      },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Mathematics for 10th Grade - Complete syllabus including Algebra, Geometry, Trigonometry and Statistics',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })

    const scienceSubject = await db.subject.upsert({
      where: { 
        classId_code: {
          classId: class10A.id,
          code: 'SCI101'
        }
      },
      update: {},
      create: {
        name: 'Science',
        code: 'SCI101',
        description: 'General Science for 10th Grade - Physics, Chemistry and Biology',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })

    const englishSubject = await db.subject.upsert({
      where: { 
        classId_code: {
          classId: class10A.id,
          code: 'ENG101'
        }
      },
      update: {},
      create: {
        name: 'English',
        code: 'ENG101',
        description: 'English Language and Literature for 10th Grade',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      },
    })
    console.log('✅ Subjects created: Mathematics, Science, English')

    // Create students
    console.log('👨‍🎓 Creating students...')
    const studentPassword = await hashPassword('student123')
    const studentNames = [
      { name: 'Alice Johnson', gender: 'FEMALE' },
      { name: 'Bob Williams', gender: 'MALE' },
      { name: 'Charlie Brown', gender: 'MALE' },
      { name: 'Diana Prince', gender: 'FEMALE' },
      { name: 'Edward Norton', gender: 'MALE' },
      { name: 'Fiona Green', gender: 'FEMALE' },
      { name: 'George Miller', gender: 'MALE' },
      { name: 'Helen Troy', gender: 'FEMALE' },
      { name: 'Ivan Drago', gender: 'MALE' },
      { name: 'Julia Roberts', gender: 'FEMALE' }
    ]

    const students = []
    for (let i = 0; i < studentNames.length; i++) {
      const studentData = studentNames[i]
      const email = `student${i + 1}@reportcardplus.com`
      
      // Create user
      const studentUser = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          name: studentData.name,
          email,
          password: studentPassword,
          role: 'STUDENT',
          phone: `+91-9876543${String(1000 + i).slice(1)}`,
        },
      })

      // Create student
      const student = await db.student.upsert({
        where: { admissionNo: `ADM2024${String(1000 + i).slice(1)}` },
        update: {},
        create: {
          userId: studentUser.id,
          rollNumber: `STU${String(1000 + i).slice(1)}`,
          admissionNo: `ADM2024${String(1000 + i).slice(1)}`,
          name: studentData.name,
          email: studentUser.email,
          phone: studentUser.phone,
          schoolId: school.id,
          classId: class10A.id,
          dateOfBirth: new Date(`2008-${String((i % 12) + 1).padStart(2, '0')}-15`),
          gender: studentData.gender as any,
          address: `${i + 1} Student Lane, Education City, State 123456, India`,
          parentName: `Parent of ${studentData.name}`,
          parentPhone: `+91-9876543${String(2000 + i).slice(1)}`,
          parentEmail: `parent${i + 1}@gmail.com`,
        },
      })

      // Update user with student ID
      await db.user.update({
        where: { id: studentUser.id },
        data: { studentId: student.id }
      })

      students.push(student)
    }
    console.log(`✅ Created ${students.length} students`)

    // Create exam
    console.log('📝 Creating exam...')
    const exam = await db.exam.upsert({
      where: { 
        schoolId_classId_name: {
          schoolId: school.id,
          classId: class10A.id,
          name: 'Unit Test 1'
        }
      },
      update: {},
      create: {
        name: 'Unit Test 1 - Mathematics',
        type: 'UNIT_TEST',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-05'),
        maxMarks: 100,
        status: 'COMPLETED',
        description: 'First unit test for Mathematics covering Chapters 1-3',
        isPublished: true,
        schoolId: school.id,
        classId: class10A.id,
      },
    })
    console.log(`✅ Exam created: ${exam.name}`)

    // Create sample results
    console.log('📊 Creating sample results...')
    for (let i = 0; i < Math.min(5, students.length); i++) {
      const student = students[i]
      
      // Math result
      const mathMarks = Math.floor(Math.random() * 30) + 70 // 70-100
      await db.result.upsert({
        where: { 
          studentId_examId_subjectId: {
            studentId: student.id,
            examId: exam.id,
            subjectId: mathSubject.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          examId: exam.id,
          subjectId: mathSubject.id,
          marksObtained: mathMarks,
          maxMarks: 100,
          percentage: mathMarks,
          grade: mathMarks >= 90 ? 'A+' : mathMarks >= 80 ? 'A' : mathMarks >= 70 ? 'B+' : mathMarks >= 60 ? 'B' : 'C',
          remarks: mathMarks >= 80 ? 'Excellent work! Keep it up!' : 'Good effort, needs more practice',
        },
      })

      // Science result
      const scienceMarks = Math.floor(Math.random() * 35) + 65 // 65-100
      await db.result.upsert({
        where: { 
          studentId_examId_subjectId: {
            studentId: student.id,
            examId: exam.id,
            subjectId: scienceSubject.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          examId: exam.id,
          subjectId: scienceSubject.id,
          marksObtained: scienceMarks,
          maxMarks: 100,
          percentage: scienceMarks,
          grade: scienceMarks >= 90 ? 'A+' : scienceMarks >= 80 ? 'A' : scienceMarks >= 70 ? 'B+' : scienceMarks >= 60 ? 'B' : 'C',
          remarks: scienceMarks >= 75 ? 'Great performance in science!' : 'Needs improvement in practical applications',
        },
      })

      // English result
      const englishMarks = Math.floor(Math.random() * 25) + 75 // 75-100
      await db.result.upsert({
        where: { 
          studentId_examId_subjectId: {
            studentId: student.id,
            examId: exam.id,
            subjectId: englishSubject.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          examId: exam.id,
          subjectId: englishSubject.id,
          marksObtained: englishMarks,
          maxMarks: 100,
          percentage: englishMarks,
          grade: englishMarks >= 90 ? 'A+' : englishMarks >= 80 ? 'A' : englishMarks >= 70 ? 'B+' : englishMarks >= 60 ? 'B' : 'C',
          remarks: englishMarks >= 85 ? 'Excellent language skills!' : 'Focus on grammar and vocabulary',
        },
      })
    }
    console.log('✅ Sample results created for top 5 students')

    // Create announcements
    console.log('📢 Creating announcements...')
    await db.announcement.upsert({
      where: { 
        schoolId_title: {
          schoolId: school.id,
          title: 'Welcome to ReportCard+ Academic Year 2024-2025'
        }
      },
      update: {},
      create: {
        title: 'Welcome to ReportCard+ Academic Year 2024-2025',
        content: 'Dear Students, Parents, and Staff,\n\nWelcome to the new academic year! We are excited to have you as part of our ReportCard+ family. This year promises to be filled with learning, growth, and achievement.\n\nKey dates to remember:\n- First day of school: June 1, 2024\n- Unit Test 1: March 1-5, 2024\n- Parent-Teacher meetings: First Saturday of every month\n- Annual Day: December 15, 2024\n\nLet\'s make this academic year a memorable and successful one together!',
        type: 'GENERAL',
        schoolId: school.id,
      },
    })

    await db.announcement.upsert({
      where: { 
        schoolId_title: {
          schoolId: school.id,
          title: 'Unit Test 1 Schedule'
        }
      },
      update: {},
      create: {
        title: 'Unit Test 1 Schedule - March 2024',
        content: 'Dear Students,\n\nUnit Test 1 is scheduled from March 1-5, 2024. Please prepare well and revise all topics covered in class.\n\nTest Schedule:\n- March 1: Mathematics (Chapters 1-3)\n- March 2: Science (Chapters 1-2)\n- March 3: English (Lessons 1-5)\n- March 4: Revision Day\n- March 5: Doubt Clearing Session\n\nAll the best for your exams!',
        type: 'EXAM',
        schoolId: school.id,
      },
    })
    console.log('✅ Announcements created')

    // Create subscriptions for students
    console.log('💳 Creating subscriptions...')
    const basicPlanStudents = students.slice(0, 3)
    const standardPlanStudents = students.slice(3, 7)
    const premiumPlanStudents = students.slice(7, 10)

    // Basic Plan subscriptions
    for (const student of basicPlanStudents) {
      await db.subscription.upsert({
        where: { studentId: student.id },
        update: {},
        create: {
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
          ]),
          autoRenew: true,
        },
      })
    }

    // Standard Plan subscriptions
    for (const student of standardPlanStudents) {
      await db.subscription.upsert({
        where: { studentId: student.id },
        update: {},
        create: {
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
          ]),
          autoRenew: true,
        },
      })
    }

    // Premium Plan subscriptions
    for (const student of premiumPlanStudents) {
      await db.subscription.upsert({
        where: { studentId: student.id },
        update: {},
        create: {
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
          ]),
          autoRenew: true,
        },
      })
    }
    console.log(`✅ Subscriptions created: ${basicPlanStudents.length} Basic, ${standardPlanStudents.length} Standard, ${premiumPlanStudents.length} Premium`)

    // Create sample invoice
    console.log('💰 Creating sample invoice...')
    await db.invoice.upsert({
      where: { 
        schoolId_planType_studentCount: {
          schoolId: school.id,
          planType: 'MIXED',
          studentCount: students.length
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        subscriptionIds: JSON.stringify(students.map(s => s.id)),
        totalAmount: 4990, // Mixed plan pricing
        status: 'PAID',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'TXN' + Date.now(),
        billingCycle: 'YEARLY',
        planType: 'MIXED',
        studentCount: students.length,
        pricing: JSON.stringify({
          basic: { students: basicPlanStudents.length, price: 299 },
          standard: { students: standardPlanStudents.length, price: 499 },
          premium: { students: premiumPlanStudents.length, price: 899 }
        }),
      },
    })
    console.log('✅ Sample invoice created')

    console.log('\n🎉 PostgreSQL database setup completed successfully!')
    console.log('\n📊 Database Summary:')
    console.log(`   School: ${school.name}`)
    console.log(`   Admin: ${admin.email}`)
    console.log(`   Teacher: ${teacher.email}`)
    console.log(`   Classes: 3 (10th A, 10th B, 9th A)`)
    console.log(`   Subjects: 3 (Mathematics, Science, English)`)
    console.log(`   Students: ${students.length}`)
    console.log(`   Subscriptions: ${students.length} (Mixed plans)`)
    console.log(`   Exam: ${exam.name}`)
    console.log(`   Announcements: 2`)
    console.log(`   Invoice: 1 (Sample)`)
    
    console.log('\n🔑 Demo Login Credentials:')
    console.log('   Admin: admin@reportcardplus.com / admin123')
    console.log('   Teacher: teacher@reportcardplus.com / teacher123')
    console.log('   Student: student1@reportcardplus.com / student123')
    console.log('   (student2-10@reportcardplus.com / student123)')

  } catch (error) {
    console.error('❌ Error during database setup:', error)
    throw error
  } finally {
    await db.$disconnect()
    console.log('\n✅ Database connection closed')
  }
}

main()
  .catch((e) => {
    console.error('❌ Database setup failed:', e)
    process.exit(1)
  })
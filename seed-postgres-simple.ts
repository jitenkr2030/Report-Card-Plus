import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth'

const db = new PrismaClient()

async function main() {
  console.log('🚀 Starting PostgreSQL database seeding for ReportCard+...')
  
  try {
    // Test database connection
    await db.$connect()
    console.log('✅ Database connection successful')
    
    // Create school
    console.log('🏫 Creating demo school...')
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

    // Update user with teacher ID
    await db.user.update({
      where: { id: teacher.id },
      data: { teacherId: teacherProfile.id }
    })

    console.log(`✅ Teacher created: ${teacher.name}`)

    // Create classes
    console.log('📚 Creating classes...')
    const class10A = await db.class.create({
      data: {
        name: '10th Grade',
        section: 'A',
        schoolId: school.id,
        academicYear: '2024-2025',
        capacity: 40,
      }
    })

    const class10B = await db.class.create({
      data: {
        name: '10th Grade',
        section: 'B',
        schoolId: school.id,
        academicYear: '2024-2025',
        capacity: 40,
      }
    })

    const class9A = await db.class.create({
      data: {
        name: '9th Grade',
        section: 'A',
        schoolId: school.id,
        academicYear: '2024-2025',
        capacity: 35,
      }
    })

    console.log('✅ Created 3 classes')

    // Create subjects for 10th Grade A
    console.log('📖 Creating subjects...')
    const mathSubject = await db.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Mathematics for 10th Grade - Algebra, Geometry, Trigonometry',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      }
    })

    const scienceSubject = await db.subject.create({
      data: {
        name: 'Science',
        code: 'SCI101',
        description: 'General Science for 10th Grade - Physics, Chemistry, Biology',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      }
    })

    const englishSubject = await db.subject.create({
      data: {
        name: 'English',
        code: 'ENG101',
        description: 'English Language and Literature for 10th Grade',
        maxMarks: 100,
        passMarks: 35,
        classId: class10A.id,
        teacherId: teacherProfile.id,
      }
    })

    console.log('✅ Created 3 subjects')

    // Create students
    console.log('👨‍🎓 Creating students...')
    const studentPassword = await hashPassword('student123')
    const studentNames = [
      { name: 'Alice Johnson', gender: 'FEMALE', dob: '2008-03-15' },
      { name: 'Bob Williams', gender: 'MALE', dob: '2008-06-22' },
      { name: 'Charlie Brown', gender: 'MALE', dob: '2008-09-10' },
      { name: 'Diana Prince', gender: 'FEMALE', dob: '2008-12-05' },
      { name: 'Edward Norton', gender: 'MALE', dob: '2008-02-28' },
      { name: 'Fiona Green', gender: 'FEMALE', dob: '2008-07-18' },
    ]

    const students = []
    for (let i = 0; i < studentNames.length; i++) {
      const studentInfo = studentNames[i]
      const email = `student${i + 1}@reportcardplus.com`
      
      // Create user
      const studentUser = await db.user.create({
        data: {
          name: studentInfo.name,
          email,
          password: studentPassword,
          role: 'STUDENT',
          phone: `+91-9876543${String(i + 3).padStart(2, '0')}`,
        }
      })

      // Create student
      const student = await db.student.create({
        data: {
          userId: studentUser.id,
          rollNumber: `STU${String(i + 1).padStart(3, '0')}`,
          admissionNo: `ADM2024${String(i + 1).padStart(3, '0')}`,
          name: studentInfo.name,
          email: studentUser.email,
          phone: studentUser.phone,
          schoolId: school.id,
          classId: i < 3 ? class10A.id : i < 6 ? class10B.id : class9A.id,
          dateOfBirth: new Date(studentInfo.dob),
          gender: studentInfo.gender as any,
          parentName: `Parent of ${studentInfo.name}`,
          parentPhone: `+91-9876543${String(i + 3).padStart(2, '0')}`,
          parentEmail: `parent${i + 1}@reportcardplus.com`,
        }
      })

      // Update user with student ID
      await db.user.update({
        where: { id: studentUser.id },
        data: { studentId: student.id }
      })

      students.push(student)
    }

    console.log(`✅ Created ${students.length} students`)

    // Create exams
    console.log('📝 Creating exams...')
    const unitTest1 = await db.exam.create({
      data: {
        name: 'Unit Test 1',
        type: 'UNIT_TEST',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-05'),
        maxMarks: 100,
        status: 'COMPLETED',
        description: 'First unit test for the academic year 2024-2025',
        isPublished: true,
        schoolId: school.id,
        classId: class10A.id,
      }
    })

    const midTerm = await db.exam.create({
      data: {
        name: 'Mid Term Examination',
        type: 'MID_TERM',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2024-09-25'),
        maxMarks: 100,
        status: 'PUBLISHED',
        description: 'Mid term examination for the academic year 2024-2025',
        isPublished: true,
        schoolId: school.id,
        classId: class10A.id,
      }
    })

    console.log('✅ Created 2 exams')

    // Create results for Unit Test 1
    console.log('📊 Creating results for Unit Test 1...')
    for (const student of students.slice(0, 4)) { // First 4 students in 10th A
      const subjects = [mathSubject, scienceSubject, englishSubject]
      
      for (const subject of subjects) {
        // Generate random marks between 60 and 95
        const marksObtained = Math.floor(Math.random() * 36) + 60
        const percentage = (marksObtained / 100) * 100
        const grade = percentage >= 90 ? 'A+' : 
                     percentage >= 80 ? 'A' : 
                     percentage >= 70 ? 'B+' : 
                     percentage >= 60 ? 'B' : 
                     percentage >= 50 ? 'C' : 'D'
        
        const remarks = percentage >= 80 ? 'Excellent work! Keep it up!' :
                       percentage >= 60 ? 'Good effort. Room for improvement.' :
                       'Needs more attention and hard work.'

        await db.result.create({
          data: {
            studentId: student.id,
            examId: unitTest1.id,
            subjectId: subject.id,
            marksObtained,
            maxMarks: 100,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            remarks,
            isLocked: false,
          }
        })
      }
    }

    console.log('✅ Created results for Unit Test 1')

    // Create announcements
    console.log('📢 Creating announcements...')
    await db.announcement.create({
      data: {
        title: 'Welcome to ReportCard+ - Academic Year 2024-2025',
        content: 'Dear Students, Parents, and Staff,\n\nWelcome to the new academic year 2024-2025! We are excited to have you as part of our school community. This year promises to be filled with learning, growth, and wonderful achievements.\n\nOur new digital platform ReportCard+ will help you track progress, stay updated with school activities, and communicate effectively with teachers.\n\nLet\'s make this academic year a memorable and successful one!\n\nBest regards,\nSchool Administration',
        type: 'GENERAL',
        schoolId: school.id,
      }
    })

    await db.announcement.create({
      data: {
        title: 'Unit Test 1 Schedule',
        content: 'Dear Students,\n\nUnit Test 1 is scheduled from August 1st to August 5th, 2024. Please prepare well and revise all topics covered in class.\n\nTest Schedule:\n- Mathematics: August 1st\n- Science: August 2nd\n- English: August 3rd\n\nAll the best for your exams!\n\nClass Teachers',
        type: 'EXAM',
        schoolId: school.id,
      }
    })

    console.log('✅ Created 2 announcements')

    // Create sample homework
    console.log('📚 Creating sample homework...')
    await db.homework.create({
      data: {
        title: 'Mathematics Assignment - Quadratic Equations',
        description: 'Solve all problems from Exercise 5.1 (Quadratic Equations) in your NCERT textbook. Show all steps clearly.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        classId: class10A.id,
        subjectId: mathSubject.id,
        teacherId: teacherProfile.id,
        studentId: students[0].id,
      }
    })

    console.log('✅ Created sample homework')

    // Create sample attendance
    console.log('📊 Creating sample attendance...')
    const today = new Date()
    for (const student of students.slice(0, 4)) {
      await db.attendance.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          teacherId: teacherProfile.id,
          date: today,
          status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT', // 90% attendance
        }
      })
    }

    console.log('✅ Created sample attendance')

    // Create sample subscriptions
    console.log('💳 Creating sample subscriptions...')
    const basicPlanStudents = students.slice(0, 2)
    const standardPlanStudents = students.slice(2, 4)
    const premiumPlanStudents = students.slice(4, 6)

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
          autoRenew: true,
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
          autoRenew: true,
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
          autoRenew: true,
        }
      })
    }

    console.log('✅ Created sample subscriptions')

    // Create sample invoice
    console.log('🧾 Creating sample invoice...')
    await db.invoice.create({
      data: {
        schoolId: school.id,
        subscriptionIds: JSON.stringify(basicPlanStudents.concat(standardPlanStudents, premiumPlanStudents).map(s => s.id)),
        totalAmount: (299 * 2) + (499 * 2) + (899 * 2), // Calculate total
        status: 'PAID',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'TXN' + Date.now(),
        billingCycle: 'YEARLY',
        planType: 'STANDARD',
        studentCount: 6,
        pricing: JSON.stringify({
          basic: { students: 2, price: 299, total: 598 },
          standard: { students: 2, price: 499, total: 998 },
          premium: { students: 2, price: 899, total: 1798 }
        }),
      }
    })

    console.log('✅ Created sample invoice')

    console.log('\n🎉 PostgreSQL database seeding completed successfully!')
    console.log('\n📊 Seeding Summary:')
    console.log(`📚 School: ${school.name}`)
    console.log(`👤 Users: 3 (Admin, Teacher, Students)`)
    console.log(`🏫 Classes: 3 (9th, 10th Grade)`)
    console.log(`📖 Subjects: 3 (Math, Science, English)`)
    console.log(`👨‍🎓 Students: 6`)
    console.log(`📝 Exams: 2 (Unit Test, Mid Term)`)
    console.log(`📊 Results: 12 (4 students × 3 subjects × 1 exam)`)
    console.log(`📢 Announcements: 2`)
    console.log(`📚 Homework: 1`)
    console.log(`📊 Attendance: 4`)
    console.log(`💳 Subscriptions: 6 (2 Basic, 2 Standard, 2 Premium)`)
    console.log(`🧾 Invoice: 1`)
    console.log('\n🔑 Demo Credentials:')
    console.log('Admin: admin@reportcardplus.com / admin123')
    console.log('Teacher: teacher@reportcardplus.com / teacher123')
    console.log('Student: student1@reportcardplus.com / student123')
    console.log('\n🚀 Database is ready for use!')

  } catch (error) {
    console.error('❌ Error during database seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
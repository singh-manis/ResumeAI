import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.match.deleteMany();
    await prisma.application.deleteMany();
    await prisma.resumeSkill.deleteMany();
    await prisma.jobSkill.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.education.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.job.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.user.deleteMany();

    // Create password hash
    const passwordHash = await bcrypt.hash('Demo123!', 12);
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12);

    console.log('👤 Creating users...');

    // Create demo users
    const candidate = await prisma.user.create({
        data: {
            email: 'john.developer@gmail.com',
            passwordHash,
            firstName: 'John',
            lastName: 'Developer',
            role: 'CANDIDATE',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
            bio: 'Full-stack developer with 5 years of experience',
            isVerified: true,
            isActive: true
        }
    });

    const candidate2 = await prisma.user.create({
        data: {
            email: 'jane.smith@email.com',
            passwordHash,
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'CANDIDATE',
            location: 'New York, NY',
            bio: 'Data scientist passionate about ML',
            isVerified: true,
            isActive: true
        }
    });

    const recruiter = await prisma.user.create({
        data: {
            email: 'recruiter@techcorp.com',
            passwordHash,
            firstName: 'Sarah',
            lastName: 'Recruiter',
            role: 'RECRUITER',
            phone: '+1 (555) 987-6543',
            location: 'Austin, TX',
            bio: 'Talent acquisition specialist at TechCorp',
            isVerified: true,
            isActive: true
        }
    });

    const admin = await prisma.user.create({
        data: {
            email: 'admin@resumeanalyzer.com',
            passwordHash: adminPasswordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            isVerified: true,
            isActive: true
        }
    });

    console.log('🛠 Creating skills...');

    // Create skills
    const skillsData = [
        { name: 'JavaScript', category: 'Programming' },
        { name: 'TypeScript', category: 'Programming' },
        { name: 'Python', category: 'Programming' },
        { name: 'Java', category: 'Programming' },
        { name: 'React', category: 'Frontend' },
        { name: 'Vue.js', category: 'Frontend' },
        { name: 'Angular', category: 'Frontend' },
        { name: 'Node.js', category: 'Backend' },
        { name: 'Express', category: 'Backend' },
        { name: 'PostgreSQL', category: 'Database' },
        { name: 'MongoDB', category: 'Database' },
        { name: 'AWS', category: 'Cloud' },
        { name: 'Docker', category: 'DevOps' },
        { name: 'Git', category: 'Tools' },
        { name: 'REST API', category: 'Architecture' },
        { name: 'Machine Learning', category: 'AI' },
        { name: 'Data Analysis', category: 'AI' },
        { name: 'Agile', category: 'Methodology' },
        { name: 'CI/CD', category: 'DevOps' },
        { name: 'CSS', category: 'Frontend' }
    ];

    const skills = {};
    for (const skill of skillsData) {
        skills[skill.name] = await prisma.skill.create({ data: skill });
    }

    console.log('💼 Creating jobs...');

    // Create jobs
    const job1 = await prisma.job.create({
        data: {
            recruiterId: recruiter.id,
            title: 'Senior Software Engineer',
            company: 'TechCorp',
            description: 'We are looking for a Senior Software Engineer to join our growing team. You will work on cutting-edge projects using modern technologies.\n\nResponsibilities:\n- Design and implement scalable web applications\n- Mentor junior developers\n- Participate in code reviews\n- Collaborate with product team',
            requirements: '- 5+ years of software development experience\n- Strong knowledge of JavaScript and React\n- Experience with Node.js and databases\n- Excellent problem-solving skills',
            location: 'San Francisco, CA',
            workType: 'HYBRID',
            employmentType: 'FULL_TIME',
            salaryMin: 150000,
            salaryMax: 200000,
            isActive: true,
            viewCount: 245,
            applicationCount: 32
        }
    });

    const job2 = await prisma.job.create({
        data: {
            recruiterId: recruiter.id,
            title: 'Full Stack Developer',
            company: 'StartupXYZ',
            description: 'Join our fast-paced startup as a Full Stack Developer. Work on exciting projects from day one.',
            requirements: '- 3+ years experience\n- React and Node.js expertise\n- Database experience',
            location: 'Remote',
            workType: 'REMOTE',
            employmentType: 'FULL_TIME',
            salaryMin: 100000,
            salaryMax: 140000,
            isActive: true,
            viewCount: 189,
            applicationCount: 28
        }
    });

    const job3 = await prisma.job.create({
        data: {
            recruiterId: recruiter.id,
            title: 'Junior Software Developer',
            company: 'TechCorp',
            description: 'Great opportunity for recent graduates to start their career.',
            requirements: '- Computer Science degree\n- Knowledge of JavaScript\n- Eagerness to learn',
            location: 'Austin, TX',
            workType: 'ONSITE',
            employmentType: 'FULL_TIME',
            salaryMin: 70000,
            salaryMax: 90000,
            isActive: true,
            viewCount: 412,
            applicationCount: 67
        }
    });

    // Add skills to jobs
    await prisma.jobSkill.createMany({
        data: [
            { jobId: job1.id, skillId: skills['JavaScript'].id, isRequired: true },
            { jobId: job1.id, skillId: skills['React'].id, isRequired: true },
            { jobId: job1.id, skillId: skills['Node.js'].id, isRequired: true },
            { jobId: job1.id, skillId: skills['PostgreSQL'].id, isRequired: false },
            { jobId: job1.id, skillId: skills['AWS'].id, isRequired: false },
            { jobId: job2.id, skillId: skills['React'].id, isRequired: true },
            { jobId: job2.id, skillId: skills['Node.js'].id, isRequired: true },
            { jobId: job2.id, skillId: skills['TypeScript'].id, isRequired: false },
            { jobId: job3.id, skillId: skills['JavaScript'].id, isRequired: true },
            { jobId: job3.id, skillId: skills['Git'].id, isRequired: true },
        ]
    });

    console.log('📄 Creating resumes...');

    // Create resume for candidate
    const resume = await prisma.resume.create({
        data: {
            userId: candidate.id,
            title: 'Software Engineer Resume',
            originalFileName: 'john_developer_resume.pdf',
            fileUrl: '/uploads/resumes/john_developer_resume.pdf',
            rawText: 'John Developer\nSan Francisco, CA\njohn.developer@gmail.com\n\nExperience:\nSenior Developer at TechStartup (2020-Present)\n- Led development of React-based web applications\n- Implemented CI/CD pipelines\n\nSkills:\nJavaScript, React, Node.js, Python, AWS',
            parsedData: {
                name: 'John Developer',
                email: 'john.developer@gmail.com',
                phone: '+1 (555) 123-4567',
                skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS']
            },
            atsScore: 85,
            atsBreakdown: {
                formatting: 90,
                keywords: 80,
                experience: 85,
                education: 82
            },
            aiSuggestions: [
                'Add quantifiable achievements',
                'Include more technical keywords',
                'Consider adding certifications'
            ]
        }
    });

    // Add skills to resume
    await prisma.resumeSkill.createMany({
        data: [
            { resumeId: resume.id, skillId: skills['JavaScript'].id, proficiencyLevel: 5, yearsOfExperience: 5 },
            { resumeId: resume.id, skillId: skills['React'].id, proficiencyLevel: 5, yearsOfExperience: 4 },
            { resumeId: resume.id, skillId: skills['Node.js'].id, proficiencyLevel: 4, yearsOfExperience: 3 },
            { resumeId: resume.id, skillId: skills['Python'].id, proficiencyLevel: 3, yearsOfExperience: 2 },
            { resumeId: resume.id, skillId: skills['AWS'].id, proficiencyLevel: 3, yearsOfExperience: 2 },
        ]
    });

    // Add experience
    await prisma.experience.create({
        data: {
            resumeId: resume.id,
            company: 'TechStartup Inc',
            title: 'Senior Developer',
            location: 'San Francisco, CA',
            startDate: new Date('2020-06-01'),
            isCurrent: true,
            description: 'Lead developer for React-based web applications'
        }
    });

    await prisma.experience.create({
        data: {
            resumeId: resume.id,
            company: 'WebAgency',
            title: 'Full Stack Developer',
            location: 'San Francisco, CA',
            startDate: new Date('2018-01-01'),
            endDate: new Date('2020-05-31'),
            description: 'Developed client websites using modern technologies'
        }
    });

    // Add education
    await prisma.education.create({
        data: {
            resumeId: resume.id,
            institution: 'Stanford University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: new Date('2014-09-01'),
            endDate: new Date('2018-05-31'),
            gpa: 3.8
        }
    });

    console.log('🔔 Creating notifications...');

    // Create notifications for candidate
    await prisma.notification.createMany({
        data: [
            {
                userId: candidate.id,
                type: 'MATCH',
                title: 'New Job Match',
                message: 'You have a 92% match with "Senior Software Engineer" at TechCorp!',
                metadata: { jobId: job1.id, matchScore: 92 },
                isRead: false
            },
            {
                userId: candidate.id,
                type: 'APPLICATION',
                title: 'Application Viewed',
                message: 'TechCorp viewed your application for Senior Software Engineer',
                metadata: { jobId: job1.id },
                isRead: false
            },
            {
                userId: candidate.id,
                type: 'SYSTEM',
                title: 'Resume Analysis Complete',
                message: 'Your resume has been analyzed. ATS Score: 85%',
                metadata: { resumeId: resume.id, atsScore: 85 },
                isRead: true
            }
        ]
    });

    // Create notifications for recruiter
    await prisma.notification.createMany({
        data: [
            {
                userId: recruiter.id,
                type: 'APPLICATION',
                title: 'New Application',
                message: 'John Developer applied to Senior Software Engineer',
                metadata: { jobId: job1.id, candidateId: candidate.id },
                isRead: false
            },
            {
                userId: recruiter.id,
                type: 'SYSTEM',
                title: 'Job Performance',
                message: 'Your job "Senior Software Engineer" received 32 applications this week!',
                metadata: { jobId: job1.id },
                isRead: true
            }
        ]
    });

    console.log('📊 Creating matches...');

    // Create match
    await prisma.match.create({
        data: {
            resumeId: resume.id,
            jobId: job1.id,
            overallScore: 92,
            skillMatchScore: 95,
            experienceMatchScore: 88,
            educationMatchScore: 90,
            skillGaps: ['AWS'],
            strongMatches: ['JavaScript', 'React', 'Node.js'],
            aiExplanation: {
                summary: 'Strong match for this role',
                highlights: ['5 years of relevant experience', 'Strong React skills']
            }
        }
    });

    await prisma.match.create({
        data: {
            resumeId: resume.id,
            jobId: job2.id,
            overallScore: 85,
            skillMatchScore: 88,
            experienceMatchScore: 82,
            educationMatchScore: 85,
            skillGaps: ['TypeScript'],
            strongMatches: ['React', 'Node.js'],
        }
    });

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Demo accounts:');
    console.log('  Candidate: john.developer@gmail.com / Demo123!');
    console.log('  Recruiter: recruiter@techcorp.com / Demo123!');
    console.log('  Admin: admin@resumeanalyzer.com / Admin123!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

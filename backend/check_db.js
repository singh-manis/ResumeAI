import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log('Total users:', users.length);
        users.forEach(u => console.log('Email:', u.email, 'Role:', u.role));
    } catch (e) {
        console.error('Error fetching users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();

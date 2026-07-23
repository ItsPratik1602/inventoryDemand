import { prisma } from './src/config/prisma.js';

async function checkExistingUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('🔍 Existing users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });

    // Check for admin users specifically
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    console.log(`\n👑 Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('Admin user details:');
      adminUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();

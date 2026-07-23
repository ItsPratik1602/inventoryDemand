import { prisma } from './src/config/prisma.js';

async function createEnum() {
  try {
    console.log('🔄 Creating CouponType enum...');
    
    await prisma.$executeRaw`
      CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED')
    `;
    
    console.log('✅ Created CouponType enum');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ CouponType enum already exists');
    } else {
      console.error('❌ Failed to create enum:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createEnum();

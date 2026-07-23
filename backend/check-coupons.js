import { prisma } from './src/config/prisma.js';

async function checkCoupons() {
  try {
    console.log('🔍 Checking current coupons table structure...');
    
    // Get table info
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'coupons'
      ORDER BY ordinal_position
    `;
    
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get existing coupons
    const coupons = await prisma.$queryRaw`SELECT * FROM "coupons" LIMIT 5`;
    console.log('\nExisting coupons:');
    console.log(coupons);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoupons();

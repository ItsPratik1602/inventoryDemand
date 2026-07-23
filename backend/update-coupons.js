import { prisma } from './src/config/prisma.js';

async function updateExistingCoupons() {
  try {
    console.log('🔄 Updating existing coupons...');
    
    // Get existing coupons with discount field
    const coupons = await prisma.$queryRaw`
      SELECT id, discount, minAmount FROM "coupons" WHERE discount IS NOT NULL
    `;
    
    console.log(`Found ${coupons.length} coupons to update`);
    
    for (const coupon of coupons) {
      await prisma.$executeRaw`
        UPDATE "coupons" 
        SET "value" = ${coupon.discount}, "minOrderValue" = ${coupon.minAmount || 0}
        WHERE id = ${coupon.id}
      `;
      
      console.log(`✅ Updated coupon: ${coupon.id}`);
    }
    
    console.log('🎉 Coupons updated successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingCoupons();

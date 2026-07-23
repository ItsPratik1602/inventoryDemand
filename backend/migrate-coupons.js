import { prisma } from './src/config/prisma.js';

async function migrateCoupons() {
  try {
    console.log('🔄 Migrating existing coupons to new schema...');
    
    // Get existing coupons
    const existingCoupons = await prisma.coupon.findMany();
    console.log(`Found ${existingCoupons.length} existing coupons`);
    
    // Update each coupon to match new schema
    for (const coupon of existingCoupons) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          type: 'PERCENTAGE', // Convert old discount field to percentage type
          value: coupon.discount, // Move discount to value field
          minOrderValue: coupon.minAmount || 0, // Move minAmount to minOrderValue
          maxDiscount: coupon.maxDiscount, // Keep existing maxDiscount
          usageLimit: null, // Set to unlimited for existing coupons
          usedCount: 0, // Initialize used count
        }
      });
      
      console.log(`✅ Migrated coupon: ${coupon.code}`);
    }
    
    console.log('🎉 Coupon migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCoupons();

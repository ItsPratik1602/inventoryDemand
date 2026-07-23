import { prisma } from './src/config/prisma.js';

async function completeMigration() {
  try {
    console.log('🔄 Completing coupon migration...');
    
    // Step 1: Add missing columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE "coupons" 
        ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
        ADD COLUMN IF NOT EXISTS "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER,
        ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0
      `;
      console.log('✅ Added new columns');
    } catch (error) {
      console.log('⚠️ Columns may already exist');
    }
    
    // Step 2: Update existing coupons
    const coupons = await prisma.$queryRaw`
      SELECT id, discount, "minAmount" FROM "coupons" WHERE discount IS NOT NULL
    `;
    
    console.log(`Found ${coupons.length} coupons to update`);
    
    for (const coupon of coupons) {
      await prisma.$executeRaw`
        UPDATE "coupons" 
        SET "type" = 'PERCENTAGE', 
            "value" = ${coupon.discount}, 
            "minOrderValue" = ${coupon.minAmount || 0},
            "usedCount" = 0
        WHERE id = ${coupon.id}
      `;
      
      console.log(`✅ Updated coupon: ${coupon.id}`);
    }
    
    // Step 3: Drop old columns (optional - can keep for compatibility)
    try {
      await prisma.$executeRaw`
        ALTER TABLE "coupons" 
        DROP COLUMN IF EXISTS "discount",
        DROP COLUMN IF EXISTS "minAmount"
      `;
      console.log('✅ Dropped old columns');
    } catch (error) {
      console.log('⚠️ Could not drop old columns, keeping for compatibility');
    }
    
    // Step 4: Verify the migration
    const updatedCoupons = await prisma.coupon.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minOrderValue: true,
        maxDiscount: true,
        usageLimit: true,
        usedCount: true,
        expiresAt: true,
        isActive: true
      }
    });
    
    console.log('\n🎉 Migration completed! Updated coupons:');
    updatedCoupons.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.type} ${coupon.value}% (Min: $${coupon.minOrderValue})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

completeMigration();

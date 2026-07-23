import { prisma } from './src/config/prisma.js';

async function runMigration() {
  try {
    console.log('🔄 Running coupon migration...');
    
    // Step 1: Add new columns with defaults
    await prisma.$executeRaw`
      ALTER TABLE "coupons" 
      ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
      ADD COLUMN "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN "maxDiscount" DOUBLE PRECISION,
      ADD COLUMN "usageLimit" INTEGER,
      ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0
    `;
    
    console.log('✅ Added new columns');
    
    // Step 2: Migrate data
    await prisma.$executeRaw`
      UPDATE "coupons" SET 
        "type" = 'PERCENTAGE',
        "value" = "discount",
        "minOrderValue" = "minAmount",
        "usedCount" = 0
    `;
    
    console.log('✅ Migrated data');
    
    // Step 3: Drop old columns
    await prisma.$executeRaw`
      ALTER TABLE "coupons" 
      DROP COLUMN "discount",
      DROP COLUMN "minAmount"
    `;
    
    console.log('✅ Dropped old columns');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    // Try to continue if columns already exist
    if (error.message.includes('already exists')) {
      console.log('⚠️ Columns may already exist, continuing...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

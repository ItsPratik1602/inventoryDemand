-- Add new columns to coupons table
ALTER TABLE "coupons" 
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxDiscount" DOUBLE PRECISION,
ADD COLUMN "usageLimit" INTEGER,
ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;

-- Migrate data from old columns to new columns
UPDATE "coupons" SET 
  "type" = 'PERCENTAGE',
  "value" = "discount",
  "minOrderValue" = "minAmount",
  "usedCount" = 0;

-- Drop old columns (after migration)
ALTER TABLE "coupons" 
DROP COLUMN "discount",
DROP COLUMN "minAmount";

import { prisma } from '../config/prisma.js';

const sampleCoupons = [
  {
    code: 'SAVE10',
    discount: 10,
    maxDiscount: 20,
    minAmount: 50,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    code: 'WELCOME20',
    discount: 20,
    maxDiscount: 50,
    minAmount: 100,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  },
  {
    code: 'FLAT15',
    discount: 15,
    minAmount: 25,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
  }
];

async function createSampleCoupons() {
  try {
    console.log('Creating sample coupons...');
    
    for (const couponData of sampleCoupons) {
      const coupon = await prisma.coupon.create({
        data: couponData
      });
      console.log(`✅ Created coupon: ${coupon.code}`);
    }
    
    console.log('✅ Sample coupons created successfully!');
  } catch (error) {
    console.error('❌ Error creating coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCoupons();

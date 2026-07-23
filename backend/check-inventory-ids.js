import { prisma } from './src/config/prisma.js';

async function checkInventoryIds() {
  try {
    const inventory = await prisma.inventory.findMany({
      select: {
        id: true,
        product: {
          select: { name: true }
        }
      }
    });

    console.log('📋 Inventory IDs:');
    inventory.forEach(item => {
      console.log(`ID: ${item.id} - ${item.product.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventoryIds();

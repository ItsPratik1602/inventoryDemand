import { prisma } from './src/config/prisma.js';

async function createLowStockItems() {
  try {
    console.log('🔧 Creating low stock items for testing...');
    
    // Update some items to have low stock
    const updates = [
      { id: 2, quantity: 5 },  // Denim Jeans - low stock
      { id: 4, quantity: 2 },  // Smart Watch - critical
      { id: 5, quantity: 0 },  // Wireless Headphones - out of stock
    ];

    for (const update of updates) {
      const result = await prisma.inventory.update({
        where: { id: update.id },
        data: { quantity: update.quantity },
        include: {
          product: {
            select: { name: true }
          }
        }
      });
      
      console.log(`✅ Updated ${result.product.name}: quantity = ${update.quantity}`);
    }

    console.log('\n🔍 Checking updated inventory levels...');
    
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    console.log('\n📊 Updated Inventory Levels:');
    inventory.forEach(item => {
      const reorderLevel = item.product.reorderLevel || 10;
      const isLowStock = item.quantity < reorderLevel;
      
      console.log(`${item.product.name}:`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Reorder Level: ${reorderLevel}`);
      console.log(`  Low Stock: ${isLowStock ? 'YES' : 'NO'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLowStockItems();

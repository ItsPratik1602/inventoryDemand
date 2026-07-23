import { prisma } from './src/config/prisma.js';

async function checkActualStock() {
  try {
    console.log('🔍 Checking actual inventory levels...');
    
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    console.log('\n📊 Current Inventory Levels:');
    inventory.forEach(item => {
      const reorderLevel = item.product.reorderLevel || 10;
      const isLowStock = item.quantity < reorderLevel;
      
      console.log(`${item.product.name}:`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Reorder Level: ${reorderLevel}`);
      console.log(`  Low Stock: ${isLowStock ? 'YES' : 'NO'}`);
      console.log('');
    });

    const lowStockItems = inventory.filter(item => 
      item.quantity < (item.product.reorderLevel || 10)
    );

    console.log(`\n🚨 Low Stock Items: ${lowStockItems.length}`);
    lowStockItems.forEach(item => {
      console.log(`- ${item.product.name} (${item.quantity} < ${item.product.reorderLevel || 10})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualStock();

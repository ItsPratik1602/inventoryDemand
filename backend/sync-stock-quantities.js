import { prisma } from './src/config/prisma.js';

async function syncStockQuantities() {
  try {
    console.log('🔧 Syncing stock quantities between product and inventory tables...');
    
    // Get all products with their inventory
    const products = await prisma.product.findMany({
      include: {
        inventory: true
      }
    });

    console.log(`\n📊 Found ${products.length} products to sync:`);
    
    for (const product of products) {
      const inventoryQuantity = product.inventory?.quantity || 0;
      const currentStockQuantity = product.stockQuantity || 0;
      
      if (inventoryQuantity !== currentStockQuantity) {
        console.log(`🔄 Updating ${product.name}:`);
        console.log(`   Current stockQuantity: ${currentStockQuantity}`);
        console.log(`   Inventory quantity: ${inventoryQuantity}`);
        
        // Update product.stockQuantity to match inventory.quantity
        await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: inventoryQuantity }
        });
        
        console.log(`   ✅ Updated to: ${inventoryQuantity}`);
      } else {
        console.log(`✅ ${product.name}: Already in sync (${inventoryQuantity})`);
      }
    }

    console.log('\n🎉 Stock quantities sync completed!');
    
    // Verify the sync
    console.log('\n🔍 Verification:');
    const updatedProducts = await prisma.product.findMany({
      include: {
        inventory: true
      }
    });

    updatedProducts.forEach(product => {
      const inSync = product.stockQuantity === (product.inventory?.quantity || 0);
      console.log(`${product.name}: ${product.stockQuantity} (inventory: ${product.inventory?.quantity || 0}) ${inSync ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error syncing stock quantities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncStockQuantities();

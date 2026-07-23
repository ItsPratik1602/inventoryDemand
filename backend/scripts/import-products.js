import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importProducts() {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), '..', 'data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length === headers.length) {
        const product = {
          name: values[0],
          price: parseFloat(values[1]),
          stockQuantity: parseInt(values[2]),
          category: values[3],
          reorderLevel: parseInt(values[4])
        };
        
        products.push(product);
      }
    }
    
    console.log(`Found ${products.length} products to import`);
    
    // Create or find categories
    const categories = [...new Set(products.map(p => p.category))];
    console.log('Categories to create:', categories);
    
    for (const categoryName of categories) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
    }
    
    // Get all categories
    const allCategories = await prisma.category.findMany();
    const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));
    
    // Import products
    let imported = 0;
    let skipped = 0;
    
    for (const productData of products) {
      const categoryId = categoryMap.get(productData.category);
      
      if (!categoryId) {
        console.warn(`Category not found: ${productData.category}`);
        skipped++;
        continue;
      }
      
      try {
        const product = await prisma.product.upsert({
          where: { name: productData.name },
          update: {
            price: productData.price,
            stockQuantity: productData.stockQuantity,
            categoryId: categoryId,
            reorderLevel: productData.reorderLevel
          },
          create: {
            name: productData.name,
            price: productData.price,
            stockQuantity: productData.stockQuantity,
            categoryId: categoryId,
            reorderLevel: productData.reorderLevel
          }
        });
        
        // Also create inventory record
        await prisma.inventory.upsert({
          where: { productId: product.id },
          update: { quantity: productData.stockQuantity },
          create: {
            productId: product.id,
            quantity: productData.stockQuantity
          }
        });
        
        imported++;
        console.log(`Imported: ${productData.name}`);
      } catch (error) {
        console.error(`Error importing ${productData.name}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\nImport Summary:`);
    console.log(`- Successfully imported: ${imported} products`);
    console.log(`- Skipped: ${skipped} products`);
    console.log(`- Categories created: ${categories.length}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();

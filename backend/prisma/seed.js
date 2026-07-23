import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear old data in safe order
  console.log("🧹 Clearing existing data...");
  await prisma.alert.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.couponUser.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  console.log("📂 Creating categories...");
  const electronics = await prisma.category.create({
    data: { name: "Electronics", description: "Electronic devices and gadgets" }
  });

  const clothing = await prisma.category.create({
    data: { name: "Clothing", description: "Fashion and apparel" }
  });

  const books = await prisma.category.create({
    data: { name: "Books", description: "Books and literature" }
  });

  const home = await prisma.category.create({
    data: { name: "Home", description: "Home and garden items" }
  });

  // Create users
  console.log("👤 Creating users...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN"
    }
  });

  const customerPassword = await bcrypt.hash("customer123", 12);
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alice Johnson",
        email: "user1@example.com",
        password: customerPassword,
        role: "CUSTOMER"
      }
    }),
    prisma.user.create({
      data: {
        name: "Bob Smith",
        email: "user2@example.com",
        password: customerPassword,
        role: "CUSTOMER"
      }
    }),
    prisma.user.create({
      data: {
        name: "Carol Davis",
        email: "user3@example.com",
        password: customerPassword,
        role: "CUSTOMER"
      }
    })
  ]);

  // Create products with varied stock levels
  console.log("📦 Creating products...");
  const products = [
    // Electronics
    {
      name: "Laptop Pro",
      price: 999.99,
      stockQuantity: 0, // OUT OF STOCK
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "High-performance laptop with 16GB RAM and 512GB SSD"
    },
    {
      name: "Wireless Headphones",
      price: 149.99,
      stockQuantity: 1, // CRITICAL
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "Premium noise-cancelling wireless headphones"
    },
    {
      name: "Smart Watch",
      price: 299.99,
      stockQuantity: 2, // CRITICAL
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "Fitness tracking smartwatch with heart rate monitor"
    },
    {
      name: "Tablet Pro",
      price: 599.99,
      stockQuantity: 8, // LOW STOCK
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "10-inch tablet with stylus support"
    },
    {
      name: "USB-C Hub",
      price: 49.99,
      stockQuantity: 5, // LOW STOCK
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "7-in-1 USB-C hub with HDMI and SD card reader"
    },
    {
      name: "Bluetooth Speaker",
      price: 79.99,
      stockQuantity: 25, // NORMAL
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "Portable waterproof Bluetooth speaker"
    },
    {
      name: "Wireless Mouse",
      price: 29.99,
      stockQuantity: 50, // NORMAL
      categoryId: electronics.id,
      createdBy: admin.id,
      description: "Ergonomic wireless mouse with 2.4GHz connection"
    },

    // Clothing
    {
      name: "Cotton T-Shirt",
      price: 29.99,
      stockQuantity: 0, // OUT OF STOCK
      categoryId: clothing.id,
      createdBy: admin.id,
      description: "Comfortable 100% cotton t-shirt"
    },
    {
      name: "Denim Jeans",
      price: 79.99,
      stockQuantity: 2, // CRITICAL
      categoryId: clothing.id,
      createdBy: admin.id,
      description: "Classic fit denim jeans"
    },
    {
      name: "Winter Jacket",
      price: 149.99,
      stockQuantity: 7, // LOW STOCK
      categoryId: clothing.id,
      createdBy: admin.id,
      description: "Warm winter jacket with hood"
    },
    {
      name: "Running Shoes",
      price: 89.99,
      stockQuantity: 6, // LOW STOCK
      categoryId: clothing.id,
      createdBy: admin.id,
      description: "Athletic running shoes with cushioned sole"
    },
    {
      name: "Wool Sweater",
      price: 69.99,
      stockQuantity: 30, // NORMAL
      categoryId: clothing.id,
      createdBy: admin.id,
      description: "Soft wool sweater for cold weather"
    },

    // Books
    {
      name: "Programming Book",
      price: 49.99,
      stockQuantity: 1, // CRITICAL
      categoryId: books.id,
      createdBy: admin.id,
      description: "Learn programming from scratch"
    },
    {
      name: "Fiction Novel",
      price: 19.99,
      stockQuantity: 40, // NORMAL
      categoryId: books.id,
      createdBy: admin.id,
      description: "Bestselling fiction novel"
    },
    {
      name: "Cookbook",
      price: 34.99,
      stockQuantity: 15, // NORMAL
      categoryId: books.id,
      createdBy: admin.id,
      description: "International recipes for home cooking"
    },

    // Home
    {
      name: "Coffee Maker",
      price: 89.99,
      stockQuantity: 0, // OUT OF STOCK
      categoryId: home.id,
      createdBy: admin.id,
      description: "12-cup programmable coffee maker"
    },
    {
      name: "Desk Lamp",
      price: 39.99,
      stockQuantity: 3, // CRITICAL
      categoryId: home.id,
      createdBy: admin.id,
      description: "LED desk lamp with adjustable brightness"
    },
    {
      name: "Notebook Pack",
      price: 12.99,
      stockQuantity: 9, // LOW STOCK
      categoryId: home.id,
      createdBy: admin.id,
      description: "Pack of 5 spiral notebooks"
    },
    {
      name: "Hand Sanitizer",
      price: 4.99,
      stockQuantity: 4, // LOW STOCK
      categoryId: home.id,
      createdBy: admin.id,
      description: "70% alcohol hand sanitizer gel"
    },
    {
      name: "Water Bottle",
      price: 15.99,
      stockQuantity: 35, // NORMAL
      categoryId: home.id,
      createdBy: admin.id,
      description: "Insulated stainless steel water bottle"
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    });

    // Add product images
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `https://picsum.photos/seed/${product.name.replace(/\s+/g, '')}/400/300.jpg`,
        isPrimary: true
      }
    });

    // Create inventory with reorder level
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: productData.stockQuantity,
        reorderLevel: 10
      }
    });

    createdProducts.push(product);
  }

  // Create coupons
  console.log("🎫 Creating coupons...");
  const welcomeCoupon = await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      maxDiscount: 200,
      minCartValue: 100,
      usageLimit: null,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  });

  const flatCoupon = await prisma.coupon.create({
    data: {
      code: "TRY15",
      type: "FIXED",
      value: 15,
      maxDiscount: null,
      minCartValue: 50,
      usageLimit: 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  // Assign coupons to customers
  for (const customer of customers) {
    await prisma.couponUser.create({
      data: {
        userId: customer.id,
        couponId: welcomeCoupon.id
      }
    });
  }

  console.log("✅ Database seeding completed successfully!");
  console.log(`📊 Created:`);
  console.log(`   - 1 Admin user (admin@example.com / admin123)`);
  console.log(`   - 3 Customer users (user1@example.com / customer123)`);
  console.log(`   - 4 Categories`);
  console.log(`   - ${createdProducts.length} Products`);
  console.log(`   - ${createdProducts.length} Inventory records`);
  console.log(`   - 2 Coupons`);
  console.log(`   - Stock levels: ${products.filter(p => p.stockQuantity === 0).length} out of stock, ${products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 2).length} critical, ${products.filter(p => p.stockQuantity > 2 && p.stockQuantity <= 10).length} low stock, ${products.filter(p => p.stockQuantity > 10).length} normal`);
}

main()
  .catch((error) => {
    console.error("❌ Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

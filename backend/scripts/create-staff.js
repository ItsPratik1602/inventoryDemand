import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createStaff() {
  try {
    // Check if staff already exists
    const existingStaff = await prisma.user.findUnique({
      where: { email: 'staff@inventory.com' }
    });

    if (existingStaff) {
      console.log('Staff user already exists');
      return;
    }

    // Create staff user
    const hashedPassword = await bcrypt.hash('staff123', 12);
    
    const staff = await prisma.user.create({
      data: {
        name: 'Staff User',
        email: 'staff@inventory.com',
        password: hashedPassword,
        role: 'STAFF'
      }
    });

    console.log('Staff user created successfully:');
    console.log('Email: staff@inventory.com');
    console.log('Password: staff123');
    console.log('Role:', staff.role);

  } catch (error) {
    console.error('Error creating staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStaff();

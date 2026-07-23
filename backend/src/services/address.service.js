import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

export const getUserAddresses = async (userId) => {
  const addresses = await prisma.address.findMany({
    where: { userId: parseInt(userId) },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ],
    select: {
      id: true,
      fullName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pincode: true,
      isDefault: true,
      createdAt: true
    }
  });

  return addresses;
};

export const createAddress = async (userId, addressData) => {
  const { isDefault, ...addressInfo } = addressData;

  // If this is set as default, unset all other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: parseInt(userId) },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: parseInt(userId),
      ...addressInfo,
      isDefault: isDefault || false
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pincode: true,
      isDefault: true,
      createdAt: true
    }
  });

  return address;
};

export const updateAddress = async (userId, addressId, addressData) => {
  const { isDefault, ...addressInfo } = addressData;

  // If this is set as default, unset all other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { 
        userId: parseInt(userId),
        id: { not: parseInt(addressId) }
      },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.updateMany({
    where: {
      id: parseInt(addressId),
      userId: parseInt(userId)
    },
    data: addressInfo
  });

  if (address.count === 0) {
    throw new AppError("Address not found", 404);
  }

  // Return the updated address
  return await prisma.address.findUnique({
    where: { id: parseInt(addressId) },
    select: {
      id: true,
      fullName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pincode: true,
      isDefault: true,
      createdAt: true
    }
  });
};

export const deleteAddress = async (userId, addressId) => {
  const address = await prisma.address.deleteMany({
    where: {
      id: parseInt(addressId),
      userId: parseInt(userId)
    }
  });

  if (address.count === 0) {
    throw new AppError("Address not found", 404);
  }

  return { success: true };
};

export const setDefaultAddress = async (userId, addressId) => {
  // Unset all other default addresses
  await prisma.address.updateMany({
    where: { 
      userId: parseInt(userId),
      id: { not: parseInt(addressId) }
    },
    data: { isDefault: false }
  });

  // Set this address as default
  const address = await prisma.address.updateMany({
    where: {
      id: parseInt(addressId),
      userId: parseInt(userId)
    },
    data: { isDefault: true }
  });

  if (address.count === 0) {
    throw new AppError("Address not found", 404);
  }

  return { success: true };
};

export const getDefaultAddress = async (userId) => {
  const address = await prisma.address.findFirst({
    where: { 
      userId: parseInt(userId),
      isDefault: true 
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pincode: true,
      isDefault: true,
      createdAt: true
    }
  });

  return address;
};

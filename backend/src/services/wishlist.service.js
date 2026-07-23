import { prisma } from "../config/prisma.js";

export const getWishlist = async (userId) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          images: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return wishlist;
};

export const addToWishlist = async (userId, productId) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true }
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check if item already exists in wishlist
  const existingItem = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId
    }
  });

  if (existingItem) {
    throw new Error("Product already in wishlist");
  }

  // Add to wishlist
  await prisma.wishlist.create({
    data: {
      userId,
      productId
    }
  });

  return getWishlist(userId);
};

export const removeFromWishlist = async (userId, itemId) => {
  const wishlistItem = await prisma.wishlist.findFirst({
    where: {
      id: itemId,
      userId
    },
    include: {
      product: {
        include: {
          category: true,
          images: true
        }
      }
    }
  });

  if (!wishlistItem) {
    throw new Error("Wishlist item not found");
  }

  await prisma.wishlist.delete({
    where: { id: itemId }
  });

  return getWishlist(userId);
};

export const isInWishlist = async (userId, productId) => {
  const item = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId
    }
  });

  return !!item;
};

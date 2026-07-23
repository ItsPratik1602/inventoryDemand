import { prisma } from "../config/prisma.js";

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              images: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  return cart;
};

export const addToCart = async (userId, productId, quantity) => {
  // Check if product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true }
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.stockQuantity < quantity) {
    throw new Error("Insufficient stock");
  }

  // Find or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId }
    });
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId
    }
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity }
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price
      }
    });
  }

  // Update cart timestamp
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() }
  });

  return getCart(userId);
};

export const updateCartItem = async (userId, itemId, quantity) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId }
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

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  const product = cartItem.product;

  if (product.stockQuantity < quantity) {
    throw new Error("Insufficient stock");
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });

  return getCart(userId);
};

export const removeFromCart = async (userId, itemId) => {
  console.log("Removing cart item:", { userId, itemId });
  
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId }
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

  if (!cartItem) {
    console.log("Cart item not found for:", { userId, itemId });
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: itemId }
  });

  return getCart(userId);
};

export const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    });
  }

  return getCart(userId);
};

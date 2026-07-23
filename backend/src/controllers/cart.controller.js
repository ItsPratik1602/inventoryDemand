import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import { 
  getCart, 
  addToCart as addToCartService, 
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService 
} from "../services/cart.service.js";

export const getCartController = catchAsync(async (req, res) => {
  const cart = await getCart(req.user.id);
  
  if (!cart) {
    return sendResponse(res, 200, "Cart retrieved successfully", {
      items: [],
      total: 0
    });
  }

  const total = cart.items.reduce((sum, item) => {
    return sum + (Number(item.price) * item.quantity);
  }, 0);

  return sendResponse(res, 200, "Cart retrieved successfully", {
    items: cart.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        stockQuantity: item.product.stockQuantity,
        category: item.product.category?.name,
        image: item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png'
      }
    })),
    total
  });
});

export const addToCartController = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const cart = await addToCartService(req.user.id, productId, quantity);
    const total = cart.items.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    return sendResponse(res, 201, "Product added to cart", {
      items: cart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product
      })),
      total
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const updateCartController = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await updateCartItemService(req.user.id, parseInt(itemId), quantity);
    const total = cart.items.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    return sendResponse(res, 200, "Cart updated successfully", {
      items: cart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product
      })),
      total
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const removeFromCartController = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  console.log("Remove cart request:", { userId: req.user.id, itemId, itemIdType: typeof itemId });

  try {
    const cart = await removeFromCartService(req.user.id, parseInt(itemId));
    const total = cart.items.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    return sendResponse(res, 200, "Item removed from cart", {
      items: cart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          stockQuantity: item.product.stockQuantity,
          category: item.product.category?.name,
          image: item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png'
        }
      })),
      total
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const clearCartController = catchAsync(async (req, res) => {
  try {
    const cart = await clearCartService(req.user.id);
    
    return sendResponse(res, 200, "Cart cleared successfully", {
      items: [],
      total: 0
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

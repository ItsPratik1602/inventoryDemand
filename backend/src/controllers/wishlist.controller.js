import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import { 
  getWishlist, 
  addToWishlist as addToWishlistService, 
  removeFromWishlist as removeFromWishlistService,
  isInWishlist as isInWishlistService
} from "../services/wishlist.service.js";

export const getWishlistController = catchAsync(async (req, res) => {
  const wishlist = await getWishlist(req.user.id);
  
  return sendResponse(res, 200, "Wishlist retrieved successfully", wishlist.map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      stockQuantity: item.product.stockQuantity,
      category: item.product.category?.name,
      image: item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png'
    }
  })));
});

export const addToWishlistController = catchAsync(async (req, res) => {
  const { productId } = req.body;

  const wishlist = await addToWishlistService(req.user.id, productId);
  
  return sendResponse(res, 201, "Product added to wishlist", wishlist.map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      stockQuantity: item.product.stockQuantity,
      category: item.product.category?.name,
      image: item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png'
    }
  })));
});

export const removeFromWishlistController = catchAsync(async (req, res) => {
  const { id } = req.params;

  const wishlist = await removeFromWishlistService(req.user.id, parseInt(id));
  
  return sendResponse(res, 200, "Product removed from wishlist", wishlist.map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      stockQuantity: item.product.stockQuantity,
      category: item.product.category?.name,
      image: item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png'
    }
  })));
});

export const checkWishlistController = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const inWishlist = await isInWishlistService(req.user.id, parseInt(productId));
  
  return sendResponse(res, 200, "Wishlist status checked", {
    inWishlist
  });
});

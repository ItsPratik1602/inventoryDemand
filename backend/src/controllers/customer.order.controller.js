import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import { prisma } from "../config/prisma.js";
import {
  createOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrderStatus
} from "../services/order.service.js";

export const createOrderController = catchAsync(async (req, res) => {
  console.log("=== ORDER API HIT ===");
  const userId = req.user.id;
  const { shippingAddress, paymentMethod, items, couponId, rewardPointsToUse } = req.body;
  
  console.log("REQ BODY:", req.body);
  console.log("couponId:", req.body.couponId);
  console.log("couponId type:", typeof req.body.couponId);

  if (!shippingAddress || !paymentMethod || !items || items.length === 0) {
    return sendResponse(res, 400, "Missing required fields: shippingAddress, paymentMethod, items");
  }

  try {
    let normalizedCouponId = null;
    if (couponId !== undefined && couponId !== null && couponId !== "") {
      console.log("=== COUPON LOOKUP START ===");
      const coupon = await prisma.coupon.findUnique({
        where: { id: String(couponId) }
      });
      normalizedCouponId = coupon?.id ?? null;
      console.log("CUSTOMER ORDER CONTROLLER - Coupon lookup result:", {
        requestedCouponId: couponId,
        normalizedCouponId,
        found: Boolean(coupon)
      });

      if (!coupon) {
        return sendResponse(res, 400, "Invalid coupon");
      }
    }

    console.log("=== CALLING CREATE ORDER SERVICE ===");
    const order = await createOrder(userId, {
      shippingAddress,
      paymentMethod,
      items,
      couponId: normalizedCouponId,
      rewardPointsToUse
    });
    
    return sendResponse(res, 201, "Order created successfully", order);
  } catch (error) {
    console.error("=== ORDER CREATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body that caused error:", req.body);
    return sendResponse(res, 400, error.message);
  }
});

export const getCustomerOrdersController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const query = req.query;

  try {
    const result = await getCustomerOrders(userId, query);
    
    // Debug: Check what images are in the customer orders list
    console.log(`=== CUSTOMER ORDERS LIST DEBUG ===`);
    console.log(`User ID: ${userId}`);
    result.items?.forEach((order, orderIndex) => {
      console.log(`Order ${orderIndex}: ID ${order.id}`);
      order.items?.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex}: ${item.product.name}`);
        console.log(`    Images count: ${item.product.images?.length || 0}`);
        console.log(`    Primary image: ${item.product.images?.find(img => img.isPrimary)?.url}`);
      });
    });
    
    // Process image URLs for all orders
    const processedResult = {
      ...result,
      items: result.items.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            image: (() => {
              const imageUrl = item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png';
              console.log(`Processing image for ${item.product.name}: ${imageUrl}`);
              
              // Convert uploaded image URLs to base64 endpoint URLs
              if (imageUrl.startsWith('/api/v1/images/')) {
                const filename = imageUrl.split('/').pop();
                const base64Url = `/api/v1/images/base64/products/${filename}`;
                console.log(`Converted to base64 endpoint: ${base64Url}`);
                return base64Url;
              }
              
              console.log(`Returning original URL: ${imageUrl}`);
              return imageUrl;
            })()
          }
        }))
      }))
    };
    
    return sendResponse(res, 200, "Orders retrieved successfully", processedResult);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const getCustomerOrderByIdController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const order = await getCustomerOrderById(userId, id);
    
    // Debug: Check what images are in the customer order
    console.log(`=== CUSTOMER ORDER DEBUG ===`);
    console.log(`Order ID: ${id}, User ID: ${userId}`);
    order.items?.forEach((item, index) => {
      console.log(`Item ${index}: ${item.product.name}`);
      console.log(`  Images count: ${item.product.images?.length || 0}`);
      console.log(`  Images:`, item.product.images);
      console.log(`  Primary image: ${item.product.images?.find(img => img.isPrimary)?.url}`);
    });
    
    // Process image URLs with fallback
    const processedOrder = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          image: (() => {
            const imageUrl = item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png';
            
            // Convert uploaded image URLs to base64 endpoint URLs
            if (imageUrl.startsWith('/api/v1/images/')) {
              const filename = imageUrl.split('/').pop();
              return `/api/v1/images/base64/products/${filename}`;
            }
            
            return imageUrl;
          })()
        }
      }))
    };
    
    return sendResponse(res, 200, "Order retrieved successfully", processedOrder);
  } catch (error) {
    return sendResponse(res, 404, error.message);
  }
});

export const updateCustomerOrderStatusController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return sendResponse(res, 400, "Status is required");
  }

  const validStatuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return sendResponse(res, 400, "Invalid status value");
  }

  try {
    const order = await updateCustomerOrderStatus(userId, id, status);
    
    return sendResponse(res, 200, "Order status updated successfully", order);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

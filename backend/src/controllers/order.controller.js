import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import { prisma } from "../config/prisma.js";
import {
  createOrder as createOrderService,
  getOrders as getOrdersService,
  getOrderById as getOrderByIdService,
  getAdminOrderById,
  updateOrderStatus
} from "../services/order.service.js";
import { logAuditAction } from "../middlewares/audit.middleware.js";

export const createOrderController = catchAsync(async (req, res) => {
  const { shippingAddress, paymentMethod, items, couponCode, rewardPointsToUse } = req.body;

  console.log("ORDER CONTROLLER - Request body:", req.body);
  console.log("ORDER CONTROLLER - couponCode:", couponCode);
  console.log("ORDER CONTROLLER - req.user:", req.user);

  if (!shippingAddress || !paymentMethod || !items || items.length === 0) {
    return sendResponse(res, 400, "Missing required fields");
  }

  try {
    const order = await createOrderService(req.user.id, {
      shippingAddress,
      paymentMethod,
      items,
      couponCode,
      rewardPointsToUse
    });

    // Log order placement
    await logAuditAction(req.user.id, "ORDER_PLACED", "ORDER", order.id, {
      totalAmount: order.totalAmount,
      itemCount: items.length,
      paymentMethod,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return sendResponse(res, 201, "Order created successfully", order);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const getOrdersController = catchAsync(async (req, res) => {
  try {
    const result = await getOrdersService(req.user.id, req.query);
    
    const formattedOrders = result.items.map(order => ({
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          stockQuantity: item.product.stockQuantity,
          category: item.product.category?.name,
          image: item.product.images?.find(img => img.isPrimary)?.url
        }
      }))
    }));

    return sendResponse(res, 200, "Orders retrieved successfully", {
      items: formattedOrders,
      total: result.total,
      page: result.page,
      limit: result.limit
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const getOrderByIdController = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const order = await getAdminOrderById(parseInt(id));
    
    // Debug: Check what images are in the order
    console.log(`=== ORDER DEBUG ===`);
    console.log(`Order ID: ${id}`);
    order.items?.forEach((item, index) => {
      console.log(`Item ${index}: ${item.product.name}`);
      console.log(`  Images count: ${item.product.images?.length || 0}`);
      console.log(`  Images:`, item.product.images);
      console.log(`  Primary image: ${item.product.images?.find(img => img.isPrimary)?.url}`);
    });
    
    const formattedOrder = {
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || 'PENDING',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          stockQuantity: item.product.stockQuantity,
          category: item.product.category?.name,
          image: (() => {
            const imageUrl = item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png';
            console.log(`Product ${item.product.id} image: ${imageUrl} (has images: ${!!item.product.images?.length})`);
            
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

    return sendResponse(res, 200, "Order retrieved successfully", formattedOrder);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const updateOrderStatusController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`Update order status request: id=${id}, status=${status}`);

  if (!status) {
    return sendResponse(res, 400, "Status is required");
  }

  // Validate status value
  const validStatuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return sendResponse(res, 400, "Invalid status value");
  }

  try {
    // Check current order status before updating
    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingOrder) {
      return sendResponse(res, 404, "Order not found");
    }

    // Define valid status transitions
    const validTransitions = {
      'PENDING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], // Terminal state
      'CANCELLED': []  // Terminal state
    };

    // Check if status actually changed
    if (existingOrder.status === status) {
      return sendResponse(res, 400, "Order is already in this status");
    }

    // Validate transition
    const allowedTransitions = validTransitions[existingOrder.status] || [];
    if (!allowedTransitions.includes(status)) {
      return sendResponse(res, 400, `Cannot change order from ${existingOrder.status} to ${status}. Valid transitions: ${allowedTransitions.join(', ') || 'None (terminal state)'}`);
    }

    const order = await updateOrderStatus(parseInt(id), status);
    
    console.log(`Order updated successfully: id=${id}, newStatus=${order.status}, paymentStatus=${order.paymentStatus}`);
    return sendResponse(res, 200, "Order status updated successfully", order);
  } catch (error) {
    console.log(`Error updating order status: ${error.message}`);
    return sendResponse(res, 400, error.message);
  }
});

export const getAdminOrdersController = catchAsync(async (req, res) => {
  try {
    const allowedFields = ["createdAt", "totalAmount", "status"];
    let { sortBy = "createdAt", order = "desc" } = req.query;

    if (!allowedFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const validatedQuery = {
      ...req.query,
      sortBy,
      order
    };

    const result = await getOrdersService(null, validatedQuery);
    
    const formattedOrders = result.items.map(order => ({
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user ? {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email
      } : null,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          stockQuantity: item.product.stockQuantity,
          category: item.product.category?.name,
          image: (() => {
            const imageUrl = item.product.images?.find(img => img.isPrimary)?.url || '/defaultProduct.png';
            console.log(`Product ${item.product.id} image: ${imageUrl} (has images: ${!!item.product.images?.length})`);
            
            // Convert uploaded image URLs to base64 endpoint URLs
            if (imageUrl.startsWith('/api/v1/images/')) {
              const filename = imageUrl.split('/').pop();
              return `/api/v1/images/base64/products/${filename}`;
            }
            
            return imageUrl;
          })()
        }
      }))
    }));

    return sendResponse(res, 200, "Orders retrieved successfully", {
      items: formattedOrders,
      total: result.total
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

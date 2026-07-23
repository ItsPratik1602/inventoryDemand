import { prisma } from "../config/prisma.js";

export const createAuditLog = async (userId, action, entityType, entityId, details = {}) => {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: JSON.stringify(details),
        timestamp: new Date(),
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }
};

export const getAuditLogs = async (query = {}) => {
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const safeSortBy = query.sortBy || "timestamp";
  const safeOrder = query.order === "asc" ? "asc" : "desc";

  const where = {};
  
  if (query.action) {
    where.action = query.action;
  }
  
  if (query.entityType) {
    where.entityType = query.entityType;
  }
  
  if (query.userId) {
    where.userId = query.userId;
  }
  
  // User search by name
  if (query.user) {
    where.user = {
      name: {
        contains: query.user,
        mode: 'insensitive'
      }
    };
  }
  
  // Date range filtering
  if (query.dateRange) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let dateFilter = {};
    
    switch (query.dateRange) {
      case 'today':
        dateFilter = { gte: today };
        break;
      case 'last7':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter = { gte: sevenDaysAgo };
        break;
      case 'last30':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = { gte: thirtyDaysAgo };
        break;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      where.timestamp = dateFilter;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        [safeSortBy]: safeOrder
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit
    }),
    prisma.auditLog.count({
      where
    })
  ]);

  return {
    items: logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details ? JSON.parse(log.details) : {},
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      user: log.user
    })),
    total,
    page: safePage,
    limit: safeLimit
  };
};

import { PrismaClient, Transaction, TransactionType, Prisma } from '@prisma/client';
import prisma from '../db';
import { SearchResponse } from '../types/search';

export interface TransactionFilters {
  type?: TransactionType;
  warehouseId?: string;
  performedById?: string;
  startDate?: string;
  endDate?: string;
  referenceType?: string;
}

export interface TransactionItemData {
  productId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface CreateTransactionData {
  type: TransactionType;
  warehouseId: string;
  performedById: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  items: TransactionItemData[];
}

export interface UpdateTransactionData {
  notes?: string;
  status?: string;
}

export interface TransactionSearchParams {
  search?: string;
  currentPage?: number;
  limit?: number;
  filters?: TransactionFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

class TransactionService {
  // Generate transaction number
  private generateTransactionNumber(type: TransactionType): string {
    const prefix = {
      'STOCK_IN': 'SI',
      'STOCK_OUT': 'SO',
      'ADJUSTMENT': 'ADJ',
      'RETURN': 'RET',
      'WASTE': 'WST',
      'RECYCLING': 'RCY'
    }[type] || 'TRX';
    
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}-${timestamp}-${random}`;
  }

  // Calculate reorder status
  private calculateReorderStatus(productId: string, quantity: number): string {
    // This would need to fetch product's reorder point
    // For now, return a default
    return quantity <= 10 ? 'BELOW_REORDER' : 'OK';
  }

  // Search transactions with pagination
  searchTransactionsService = async (
    params: TransactionSearchParams
  ): Promise<SearchResponse<Transaction>> => {
    const { search, currentPage = 1, limit = 10, filters = {} } = params;
    
    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: 'transactionDate', order: 'desc' };
    
    const skip = (currentPage - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    // Search across transaction fields
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters.performedById) {
      where.performedById = filters.performedById;
    }
    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transactionDate.lte = new Date(filters.endDate);
      }
    }

    // Build ORDER BY - ADD NULL CHECK!
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes('.')) {
        // Nested field like "warehouse.name"
        const [relation, field] = sort.field.split('.');
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      // Default ordering
      orderBy.transactionDate = 'desc';
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: currentPage * limit < total,
        hasPrev: currentPage > 1,
      }
    };
  };

  // Get transaction by ID
  getTransactionByIdService = async (id: string): Promise<Transaction | null> => {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        warehouse: true,
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });
  };

  // Create transaction with inventory update
  async createTransactionService(data: CreateTransactionData): Promise<Transaction> {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate warehouse exists
      const warehouse = await tx.warehouse.findUnique({
        where: { id: data.warehouseId }
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      // Validate user exists
      const user = await tx.user.findUnique({
        where: { id: data.performedById }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate all products exist
      const productIds = data.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        throw new Error(`Products not found: ${missingIds.join(', ')}`);
      }

      // Check inventory for stock out transactions
      for (const item of data.items) {
        if (data.type === 'STOCK_OUT' || data.type === 'WASTE' || data.type === 'RECYCLING') {
          const inventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: data.warehouseId,
                productId: item.productId
              }
            }
          });

          if (!inventory || inventory.available < item.quantity) {
            const product = products.find(p => p.id === item.productId);
            throw new Error(`Insufficient stock for product ${product?.name || item.productId}`);
          }
        }
      }

      // Calculate totals
      let totalItems = 0;
      let totalValue = 0;
      const itemsData: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        previousQty?: number;
        newQty?: number;
      }> = [];

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        const unitPrice = item.unitPrice || product?.costPrice || 0;
        const itemValue = item.quantity * unitPrice;

        totalItems += item.quantity;
        totalValue += itemValue;

        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: itemValue,
          previousQty: undefined,
          newQty: undefined
        });
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber: this.generateTransactionNumber(data.type),
          type: data.type,
          warehouseId: data.warehouseId,
          performedById: data.performedById,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          totalItems,
          totalValue,
          notes: data.notes,
          items: {
            create: itemsData
          }
        },
        include: {
          warehouse: true,
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      // Update inventory based on transaction type
      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        const inventoryWhere = {
          warehouseId_productId: {
            warehouseId: data.warehouseId,
            productId: item.productId
          }
        };

        const existingInventory = await tx.inventory.findUnique({
          where: inventoryWhere
        });

        if (existingInventory) {
          let newQuantity = existingInventory.quantity;
          let newAvailable = existingInventory.available;

          switch (data.type) {
            case 'STOCK_IN':
            case 'RETURN':
              newQuantity += item.quantity;
              newAvailable += item.quantity;
              break;
            
            case 'STOCK_OUT':
            case 'WASTE':
            case 'RECYCLING':
              newQuantity -= item.quantity;
              newAvailable -= item.quantity;
              break;
            
            case 'ADJUSTMENT':
              newQuantity = item.quantity;
              newAvailable = Math.max(0, newQuantity - existingInventory.reserved);
              break;
          }

          // Update inventory
          await tx.inventory.update({
            where: inventoryWhere,
            data: {
              quantity: newQuantity,
              available: newAvailable,
              lastUpdated: new Date(),
              reorderStatus: this.calculateReorderStatus(item.productId, newQuantity)
            }
          });

          // For adjustments, update the transaction item with previous quantity
          if (data.type === 'ADJUSTMENT') {
            await tx.transactionItem.updateMany({
              where: {
                transactionId: transaction.id,
                productId: item.productId
              },
              data: {
                previousQty: existingInventory.quantity,
                newQty: item.quantity
              }
            });
          }
        } else if (data.type === 'STOCK_IN' || data.type === 'RETURN') {
          // Create new inventory record if it doesn't exist
          await tx.inventory.create({
            data: {
              warehouseId: data.warehouseId,
              productId: item.productId,
              quantity: item.quantity,
              available: item.quantity,
              reserved: 0,
              reorderStatus: this.calculateReorderStatus(item.productId, item.quantity)
            }
          });
        }
      }

      return transaction;
    });
  }

  // Update transaction
  async updateTransactionService(id: string, data: UpdateTransactionData): Promise<Transaction> {
    return await prisma.transaction.update({
      where: { id },
      data: {
        notes: data.notes
      },
      include: {
        warehouse: true,
        performedBy: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  // Delete transaction (with inventory reversal)
  async deleteTransactionService(id: string): Promise<{ message: string }> {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          items: true
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Reverse inventory changes
      for (const item of transaction.items) {
        const inventoryWhere = {
          warehouseId_productId: {
            warehouseId: transaction.warehouseId,
            productId: item.productId
          }
        };

        const existingInventory = await tx.inventory.findUnique({
          where: inventoryWhere
        });

        if (existingInventory) {
          let newQuantity = existingInventory.quantity;
          let newAvailable = existingInventory.available;

          // Reverse the transaction effect
          switch (transaction.type) {
            case 'STOCK_IN':
            case 'RETURN':
              newQuantity -= item.quantity;
              newAvailable -= item.quantity;
              break;
            
            case 'STOCK_OUT':
            case 'WASTE':
            case 'RECYCLING':
              newQuantity += item.quantity;
              newAvailable += item.quantity;
              break;
            
            case 'ADJUSTMENT':
              // For adjustments, we need to restore to previous quantity
              if (item.previousQty !== null && item.previousQty !== undefined) {
                newQuantity = item.previousQty;
                newAvailable = Math.max(0, newQuantity - existingInventory.reserved);
              }
              break;
          }

          await tx.inventory.update({
            where: inventoryWhere,
            data: {
              quantity: newQuantity,
              available: newAvailable,
              lastUpdated: new Date(),
              reorderStatus: this.calculateReorderStatus(item.productId, newQuantity)
            }
          });
        }
      }

      // Delete transaction items first (due to foreign key constraint)
      await tx.transactionItem.deleteMany({
        where: { transactionId: id }
      });

      // Delete transaction
      await tx.transaction.delete({
        where: { id }
      });

      return { message: 'Transaction deleted successfully' };
    });
  }

  // Get transaction statistics
  async getTransactionStatisticsService(): Promise<any> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalTransactions,
      todayTransactions,
      monthlyTransactions,
      yearlyTransactions,
      transactionsByType
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({
        where: {
          transactionDate: {
            gte: new Date(today.setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.transaction.count({
        where: {
          transactionDate: { gte: startOfMonth }
        }
      }),
      prisma.transaction.count({
        where: {
          transactionDate: { gte: startOfYear }
        }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ]);

    return {
      counts: {
        total: totalTransactions,
        today: todayTransactions,
        thisMonth: monthlyTransactions,
        thisYear: yearlyTransactions
      },
      byType: transactionsByType.map(t => ({
        type: t.type,
        count: t._count.id
      }))
    };
  }

  // Get transactions by warehouse
  async getTransactionsByWarehouseService(
    warehouseId: string,
    params: TransactionSearchParams
  ): Promise<SearchResponse<Transaction>> {
    const { search, currentPage = 1, limit = 10, filters = {} } = params;
    
    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: 'transactionDate', order: 'desc' };
    
    const skip = (currentPage - 1) * limit;

    const where: any = { warehouseId };

    // Search
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transactionDate.lte = new Date(filters.endDate);
      }
    }

    // Build ORDER BY
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes('.')) {
        const [relation, field] = sort.field.split('.');
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      orderBy.transactionDate = 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: currentPage * limit < total,
        hasPrev: currentPage > 1,
      }
    };
  }
}

export default TransactionService;
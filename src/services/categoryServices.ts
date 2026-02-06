import { prisma } from "../lib/db";

interface SearchParams {
  search: string;
  currentPage: number;
  limit: number;
  filters: Record<string, any>;
  sort: { field: string; order: "asc" | "desc" };
}

interface SearchResult {
  data: any[];
  pagination: {
    currentPage: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CategoryTreeItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isRecyclable: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: any;
  _count: {
    products: number;
    children: number;
  };
  children: CategoryTreeItem[];
}

interface CategoryStatistics {
  counts: {
    totalCategories: number;
    totalProducts: number;
    categoriesWithProducts: number;
    recyclableCategories: number;
    averageProductsPerCategory: number;
  };
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
    subcategoryCount: number;
  }>;
}

export default class CategoryServices {
  // MAIN SEARCH METHOD with pagination
  searchCategoriesService = async (params: SearchParams): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;
    
    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: "name", order: "asc" };
    
    const skip = (currentPage - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    // Search across category fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Apply filters
    if (filters.parentId !== undefined) {
      if (filters.parentId === null || filters.parentId === "null") {
        where.parentId = null; // Root categories
      } else {
        where.parentId = filters.parentId;
      }
    }
    
    if (filters.isRecyclable !== undefined) {
      where.isRecyclable = filters.isRecyclable === true || filters.isRecyclable === "true";
    }

    // Build ORDER BY - FIXED: Added null check
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        // Nested field like "parent.name"
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      // Default ordering
      orderBy.name = "asc";
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data,
      pagination: {
        currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: currentPage * limit < total,
        hasPrev: currentPage > 1,
      },
    };
  };

  // GET category by ID (single record)
  getCategoryByIdService = async (id: string): Promise<any> => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            description: true,
            isRecyclable: true,
            _count: {
              select: {
                products: true,
                children: true
              }
            }
          },
          orderBy: { name: "asc" }
        },
        products: {
          include: {
            _count: {
              select: {
                inventory: true
              }
            }
          },
          take: 10, // Limit products for preview
          orderBy: { name: "asc" }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  };

  // GET full category tree (hierarchical)
  getCategoryTreeService = async (): Promise<CategoryTreeItem[]> => {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    // Build tree structure
    const buildTree = (parentId: string | null): CategoryTreeItem[] => {
      return categories
        .filter(category => category.parentId === parentId)
        .map(category => ({
          ...category,
          children: buildTree(category.id)
        }));
    };

    return buildTree(null); // Start with root categories (parentId = null)
  };

  // GET subcategories by parent ID
  getSubcategoriesService = async (parentId: string): Promise<any[]> => {
    return await prisma.category.findMany({
      where: { parentId },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      },
      orderBy: { name: "asc" }
    });
  };

  // GET products by category ID
  getProductsByCategoryService = async (
    categoryId: string, 
    params: SearchParams
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;
    
    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: "name", order: "asc" };
    
    const skip = (currentPage - 1) * limit;

    const where: any = {
      categoryId,
      isActive: true
    };

    // Search across product fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Apply filters
    if (filters.isEcoFriendly !== undefined) {
      where.isEcoFriendly = filters.isEcoFriendly === true || filters.isEcoFriendly === "true";
    }
    if (filters.materialType) {
      where.materialType = filters.materialType;
    }

    // Build ORDER BY
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      orderBy.name = "asc";
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              inventory: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data,
      pagination: {
        currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: currentPage * limit < total,
        hasPrev: currentPage > 1,
      },
    };
  };

  // CREATE category
  createCategoryService = async (data: any): Promise<any> => {
    const { name, description, parentId, isRecyclable = false } = data;

    // Validate required fields
    if (!name) {
      throw new Error("Category name is required");
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      throw new Error(`Category with name "${name}" already exists`);
    }

    // If parentId is provided, validate it exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      });
      
      if (!parent) {
        throw new Error("Parent category not found");
      }
    }

    return await prisma.category.create({
      data: {
        name,
        description,
        parentId: parentId || null,
        isRecyclable: Boolean(isRecyclable)
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  };

  // UPDATE category
  updateCategoryService = async (id: string, data: any): Promise<any> => {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    // Prevent circular hierarchy
    if (data.parentId === id) {
      throw new Error("Category cannot be its own parent");
    }

    // If parentId is being set, check for circular references
    if (data.parentId) {
      let currentParentId = data.parentId;
      const visited = new Set<string>();
      
      while (currentParentId) {
        if (visited.has(currentParentId)) {
          throw new Error("Circular reference detected in category hierarchy");
        }
        
        if (currentParentId === id) {
          throw new Error("Circular reference detected");
        }
        
        visited.add(currentParentId);
        const parent = await prisma.category.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        
        currentParentId = parent?.parentId || null;
      }
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findUnique({
        where: { name: data.name }
      });
      
      if (duplicateCategory) {
        throw new Error(`Category with name "${data.name}" already exists`);
      }
    }

    return await prisma.category.update({
      where: { id },
      data: {
        ...data,
        isRecyclable: data.isRecyclable !== undefined ? Boolean(data.isRecyclable) : undefined
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  };

  // DELETE category
  deleteCategoryService = async (id: string): Promise<{ message: string }> => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new Error("Cannot delete category with products. Move or delete products first.");
    }

    // Check if category has subcategories
    if (category._count.children > 0) {
      throw new Error("Cannot delete category with subcategories. Delete or move subcategories first.");
    }

    await prisma.category.delete({
      where: { id }
    });

    return { message: "Category deleted successfully" };
  };

  // GET category statistics
  getCategoryStatisticsService = async (): Promise<CategoryStatistics> => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    const totalCategories = categories.length;
    const totalProducts = categories.reduce((sum, cat) => sum + cat._count.products, 0);
    const categoriesWithProducts = categories.filter(cat => cat._count.products > 0).length;
    const recyclableCategories = categories.filter(cat => cat.isRecyclable).length;

    // Get top categories by product count
    const topCategories = [...categories]
      .sort((a, b) => b._count.products - a._count.products)
      .slice(0, 5)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products,
        subcategoryCount: cat._count.children
      }));

    return {
      counts: {
        totalCategories,
        totalProducts,
        categoriesWithProducts,
        recyclableCategories,
        averageProductsPerCategory: totalCategories > 0 ? totalProducts / totalCategories : 0
      },
      topCategories
    };
  };
}
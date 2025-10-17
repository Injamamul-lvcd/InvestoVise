import { Product, AffiliatePartner } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

export interface ProductFilters {
  type?: string;
  partnerId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minInterestRate?: number;
  maxInterestRate?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface CreateProductData {
  name: string;
  type: 'personal_loan' | 'home_loan' | 'car_loan' | 'business_loan' | 'credit_card' | 'broker_account';
  features: Array<{
    name: string;
    value: string;
    description?: string;
  }>;
  eligibility: Array<{
    type: 'age' | 'income' | 'credit_score' | 'employment' | 'other';
    description: string;
    minValue?: number;
    maxValue?: number;
  }>;
  applicationUrl: string;
  description: string;
  termsAndConditions: string;
  processingTime: string;
  interestRate?: number;
  fees?: Array<{
    type: 'processing' | 'annual' | 'late_payment' | 'other';
    amount: number;
    description: string;
    isPercentage?: boolean;
  }>;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
}

export class ProductService {
  /**
   * Get paginated list of products with filtering
   */
  static async getProducts(filters: ProductFilters = {}) {
    await connectToDatabase();

    const {
      type,
      partnerId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'priority',
      sortOrder = 'desc',
      minInterestRate,
      maxInterestRate,
      minAmount,
      maxAmount
    } = filters;

    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (partnerId) filter.partnerId = partnerId;
    if (isActive !== undefined) filter.isActive = isActive;
    
    // Interest rate filtering
    if (minInterestRate || maxInterestRate) {
      filter.interestRate = {};
      if (minInterestRate) filter.interestRate.$gte = minInterestRate;
      if (maxInterestRate) filter.interestRate.$lte = maxInterestRate;
    }
    
    // Amount filtering
    if (minAmount) filter.minAmount = { $lte: minAmount };
    if (maxAmount) filter.maxAmount = { $gte: maxAmount };

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Add secondary sort by name for consistency
    if (sortBy !== 'name') {
      sort.name = 1;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('partnerId', 'name type logoUrl website')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid product ID');
    }

    const product = await Product.findById(id)
      .populate('partnerId', 'name type logoUrl website contactEmail');
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Create new product
   */
  static async createProduct(partnerId: string, data: CreateProductData) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    // Check if partner exists
    const partner = await AffiliatePartner.findById(partnerId);
    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    // Create new product
    const product = new Product({
      ...data,
      partnerId
    });
    
    await product.save();

    // Add product to partner's products array
    await partner.addProduct(product._id.toString());

    // Populate the product with partner info
    await product.populate('partnerId', 'name type logoUrl');

    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, data: Partial<CreateProductData>) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid product ID');
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('partnerId', 'name type logoUrl website contactEmail');

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid product ID');
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new Error('Product not found');
    }

    // Remove product from partner's products array
    const partner = await AffiliatePartner.findById(product.partnerId);
    if (partner) {
      await partner.removeProduct(id);
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    return product;
  }

  /**
   * Get products by partner
   */
  static async getProductsByPartner(partnerId: string, filters: Omit<ProductFilters, 'partnerId'> = {}) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    return await this.getProducts({ ...filters, partnerId });
  }

  /**
   * Get active products by type
   */
  static async getActiveProductsByType(type: string, filters: ProductFilters = {}) {
    await connectToDatabase();

    return await Product.findByTypeWithFilters(type, {
      minInterestRate: filters.minInterestRate,
      maxInterestRate: filters.maxInterestRate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount
    });
  }

  /**
   * Check product eligibility for user
   */
  static async checkEligibility(productId: string, userProfile: any) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID');
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product.checkEligibility(userProfile);
  }

  /**
   * Get product comparison data
   */
  static async compareProducts(productIds: string[]) {
    await connectToDatabase();

    // Validate all product IDs
    for (const id of productIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid product ID: ${id}`);
      }
    }

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).populate('partnerId', 'name type logoUrl website');

    if (products.length !== productIds.length) {
      throw new Error('One or more products not found');
    }

    return products;
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, filters: ProductFilters = {}) {
    await connectToDatabase();

    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'features.name': { $regex: query, $options: 'i' } },
        { 'features.value': { $regex: query, $options: 'i' } }
      ]
    };

    // Combine with other filters
    const combinedFilter = { ...searchFilter };
    if (filters.type) combinedFilter.type = filters.type;
    if (filters.isActive !== undefined) combinedFilter.isActive = filters.isActive;
    if (filters.partnerId) combinedFilter.partnerId = filters.partnerId;

    const products = await Product.find(combinedFilter)
      .populate('partnerId', 'name type logoUrl website')
      .sort({ priority: -1, name: 1 })
      .limit(filters.limit || 20);

    return products;
  }

  /**
   * Get product statistics
   */
  static async getProductStats(partnerId?: string) {
    await connectToDatabase();

    const matchStage: any = { isActive: true };
    if (partnerId) {
      if (!mongoose.Types.ObjectId.isValid(partnerId)) {
        throw new Error('Invalid partner ID');
      }
      matchStage.partnerId = new mongoose.Types.ObjectId(partnerId);
    }

    const stats = await Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalProducts: { $sum: 1 },
          avgInterestRate: { $avg: '$interestRate' },
          minInterestRate: { $min: '$interestRate' },
          maxInterestRate: { $max: '$interestRate' },
          avgMinAmount: { $avg: '$minAmount' },
          avgMaxAmount: { $avg: '$maxAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return stats;
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(type?: string, limit: number = 10) {
    await connectToDatabase();

    const filter: any = { isActive: true, priority: { $gte: 80 } };
    if (type) filter.type = type;

    const products = await Product.find(filter)
      .populate('partnerId', 'name type logoUrl website')
      .sort({ priority: -1, name: 1 })
      .limit(limit);

    return products;
  }
}
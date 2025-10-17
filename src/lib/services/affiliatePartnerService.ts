import { AffiliatePartner, Product } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

export interface AffiliatePartnerFilters {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAffiliatePartnerData {
  name: string;
  type: 'loan' | 'credit_card' | 'broker';
  logoUrl: string;
  description: string;
  website: string;
  contactEmail: string;
  commissionStructure: {
    type: 'fixed' | 'percentage';
    amount: number;
    currency: string;
    conditions?: string[];
  };
  trackingConfig: {
    trackingPixel?: string;
    conversionGoals: string[];
    attributionWindow: number;
  };
  apiEndpoint?: string;
}

export class AffiliatePartnerService {
  /**
   * Get paginated list of affiliate partners with filtering
   */
  static async getPartners(filters: AffiliatePartnerFilters = {}) {
    await connectToDatabase();

    const {
      type,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get partners with pagination
    const partners = await AffiliatePartner.find(filter)
      .populate('products')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await AffiliatePartner.countDocuments(filter);

    return {
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get affiliate partner by ID
   */
  static async getPartnerById(id: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findById(id).populate('products');
    
    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    return partner;
  }

  /**
   * Create new affiliate partner
   */
  static async createPartner(data: CreateAffiliatePartnerData) {
    await connectToDatabase();

    const partner = new AffiliatePartner(data);
    await partner.save();

    return partner;
  }

  /**
   * Update affiliate partner
   */
  static async updatePartner(id: string, data: Partial<CreateAffiliatePartnerData>) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('products');

    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    return partner;
  }

  /**
   * Delete affiliate partner
   */
  static async deletePartner(id: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findByIdAndDelete(id);

    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    return partner;
  }

  /**
   * Get active partners by type
   */
  static async getActivePartnersByType(type: string) {
    await connectToDatabase();

    return await AffiliatePartner.findByType(type);
  }

  /**
   * Add product to partner
   */
  static async addProductToPartner(partnerId: string, productId: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findById(partnerId);
    
    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    await partner.addProduct(productId);
    return partner;
  }

  /**
   * Remove product from partner
   */
  static async removeProductFromPartner(partnerId: string, productId: string) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findById(partnerId);
    
    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    await partner.removeProduct(productId);
    return partner;
  }

  /**
   * Get partner statistics
   */
  static async getPartnerStats(partnerId?: string) {
    await connectToDatabase();

    const matchStage: any = {};
    if (partnerId) {
      if (!mongoose.Types.ObjectId.isValid(partnerId)) {
        throw new Error('Invalid partner ID');
      }
      matchStage._id = new mongoose.Types.ObjectId(partnerId);
    }

    const stats = await AffiliatePartner.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'partnerId',
          as: 'products'
        }
      },
      {
        $group: {
          _id: '$type',
          totalPartners: { $sum: 1 },
          activePartners: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalProducts: { $sum: { $size: '$products' } },
          avgProductsPerPartner: { $avg: { $size: '$products' } }
        }
      }
    ]);

    return stats;
  }

  /**
   * Search partners by name or description
   */
  static async searchPartners(query: string, filters: AffiliatePartnerFilters = {}) {
    await connectToDatabase();

    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // Combine with other filters
    const combinedFilter = { ...searchFilter };
    if (filters.type) combinedFilter.type = filters.type;
    if (filters.isActive !== undefined) combinedFilter.isActive = filters.isActive;

    const partners = await AffiliatePartner.find(combinedFilter)
      .populate('products')
      .sort({ name: 1 })
      .limit(filters.limit || 20);

    return partners;
  }
}
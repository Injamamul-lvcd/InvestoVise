import mongoose, { Schema } from 'mongoose';
import { IProduct } from '@/types/database';

const ProductFeatureSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Feature name is required'],
    trim: true,
    maxlength: [100, 'Feature name cannot exceed 100 characters']
  },
  value: {
    type: String,
    required: [true, 'Feature value is required'],
    trim: true,
    maxlength: [200, 'Feature value cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Feature description cannot exceed 300 characters']
  }
}, { _id: false });

const EligibilityRequirementSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Eligibility type is required'],
    enum: {
      values: ['age', 'income', 'credit_score', 'employment', 'other'],
      message: 'Invalid eligibility requirement type'
    }
  },
  description: {
    type: String,
    required: [true, 'Eligibility description is required'],
    trim: true,
    maxlength: [200, 'Eligibility description cannot exceed 200 characters']
  },
  minValue: {
    type: Number,
    min: [0, 'Minimum value cannot be negative']
  },
  maxValue: {
    type: Number,
    validate: {
      validator: function(v: number) {
        return !this.minValue || !v || v >= this.minValue;
      },
      message: 'Maximum value must be greater than minimum value'
    }
  }
}, { _id: false });

const FeeSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Fee type is required'],
    enum: {
      values: ['processing', 'annual', 'late_payment', 'other'],
      message: 'Invalid fee type'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Fee amount is required'],
    min: [0, 'Fee amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Fee description is required'],
    trim: true,
    maxlength: [200, 'Fee description cannot exceed 200 characters']
  },
  isPercentage: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'AffiliatePartner',
    required: [true, 'Partner ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Product type is required'],
    enum: {
      values: ['personal_loan', 'home_loan', 'car_loan', 'business_loan', 'credit_card', 'broker_account'],
      message: 'Invalid product type'
    },
    index: true
  },
  features: {
    type: [ProductFeatureSchema],
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'At least one feature is required'
    }
  },
  eligibility: {
    type: [EligibilityRequirementSchema],
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'At least one eligibility requirement is required'
    }
  },
  interestRate: {
    type: Number,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%'],
    validate: {
      validator: function(v: number) {
        // Interest rate is required for loan products
        const loanTypes = ['personal_loan', 'home_loan', 'car_loan', 'business_loan'];
        return !loanTypes.includes(this.type) || (v !== null && v !== undefined);
      },
      message: 'Interest rate is required for loan products'
    }
  },
  fees: [FeeSchema],
  applicationUrl: {
    type: String,
    required: [true, 'Application URL is required'],
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Application URL must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative'],
    max: [100, 'Priority cannot exceed 100'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  termsAndConditions: {
    type: String,
    required: [true, 'Terms and conditions are required'],
    trim: true,
    maxlength: [5000, 'Terms and conditions cannot exceed 5000 characters']
  },
  processingTime: {
    type: String,
    required: [true, 'Processing time is required'],
    trim: true,
    maxlength: [100, 'Processing time cannot exceed 100 characters']
  },
  minAmount: {
    type: Number,
    min: [0, 'Minimum amount cannot be negative'],
    validate: {
      validator: function(v: number) {
        // Amount limits are required for loan products
        const loanTypes = ['personal_loan', 'home_loan', 'car_loan', 'business_loan'];
        return !loanTypes.includes(this.type) || (v !== null && v !== undefined);
      },
      message: 'Minimum amount is required for loan products'
    }
  },
  maxAmount: {
    type: Number,
    validate: {
      validator: function(v: number) {
        // Check if max amount is greater than min amount
        return !this.minAmount || !v || v >= this.minAmount;
      },
      message: 'Maximum amount must be greater than minimum amount'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ProductSchema.index({ partnerId: 1, type: 1 });
ProductSchema.index({ type: 1, isActive: 1 });
ProductSchema.index({ priority: -1, name: 1 });
ProductSchema.index({ isActive: 1, priority: -1 });

// Virtual for effective interest rate display
ProductSchema.virtual('displayInterestRate').get(function() {
  if (this.interestRate) {
    return `${this.interestRate}% p.a.`;
  }
  return 'N/A';
});

// Virtual for amount range display
ProductSchema.virtual('amountRange').get(function() {
  if (this.minAmount && this.maxAmount) {
    return `₹${this.minAmount.toLocaleString('en-IN')} - ₹${this.maxAmount.toLocaleString('en-IN')}`;
  } else if (this.minAmount) {
    return `₹${this.minAmount.toLocaleString('en-IN')} onwards`;
  } else if (this.maxAmount) {
    return `Up to ₹${this.maxAmount.toLocaleString('en-IN')}`;
  }
  return 'Contact for details';
});

// Static method to find active products
ProductSchema.statics.findActive = function(type?: string) {
  const filter: any = { isActive: true };
  if (type) {
    filter.type = type;
  }
  return this.find(filter).populate('partnerId').sort({ priority: -1, name: 1 });
};

// Static method to find by partner
ProductSchema.statics.findByPartner = function(partnerId: string) {
  return this.find({ partnerId, isActive: true }).sort({ priority: -1, name: 1 });
};

// Static method to find by type with filters
ProductSchema.statics.findByTypeWithFilters = function(type: string, filters: any = {}) {
  const query: any = { type, isActive: true };
  
  if (filters.minInterestRate || filters.maxInterestRate) {
    query.interestRate = {};
    if (filters.minInterestRate) query.interestRate.$gte = filters.minInterestRate;
    if (filters.maxInterestRate) query.interestRate.$lte = filters.maxInterestRate;
  }
  
  if (filters.minAmount || filters.maxAmount) {
    if (filters.minAmount) query.minAmount = { $lte: filters.minAmount };
    if (filters.maxAmount) query.maxAmount = { $gte: filters.maxAmount };
  }
  
  return this.find(query).populate('partnerId').sort({ priority: -1, name: 1 });
};

// Instance method to check eligibility
ProductSchema.methods.checkEligibility = function(userProfile: any): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let eligible = true;
  
  for (const requirement of this.eligibility) {
    switch (requirement.type) {
      case 'age':
        if (userProfile.age && requirement.minValue && userProfile.age < requirement.minValue) {
          eligible = false;
          reasons.push(`Minimum age requirement: ${requirement.minValue} years`);
        }
        if (userProfile.age && requirement.maxValue && userProfile.age > requirement.maxValue) {
          eligible = false;
          reasons.push(`Maximum age limit: ${requirement.maxValue} years`);
        }
        break;
      case 'income':
        if (userProfile.annualIncome && requirement.minValue && userProfile.annualIncome < requirement.minValue) {
          eligible = false;
          reasons.push(`Minimum income requirement: ₹${requirement.minValue.toLocaleString('en-IN')} per annum`);
        }
        break;
    }
  }
  
  return { eligible, reasons };
};

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
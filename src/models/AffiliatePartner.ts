import mongoose, { Schema } from 'mongoose';
import { IAffiliatePartner } from '@/types/database';

const CommissionStructureSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Commission type is required'],
    enum: {
      values: ['fixed', 'percentage'],
      message: 'Commission type must be either fixed or percentage'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Commission amount is required'],
    min: [0, 'Commission amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: {
      values: ['INR'],
      message: 'Only INR currency is supported'
    },
    default: 'INR'
  },
  conditions: [{
    type: String,
    trim: true,
    maxlength: [200, 'Condition cannot exceed 200 characters']
  }]
}, { _id: false });

const TrackingConfigSchema = new Schema({
  trackingPixel: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Tracking pixel must be a valid URL'
    }
  },
  conversionGoals: [{
    type: String,
    required: true,
    trim: true,
    enum: {
      values: ['application_submitted', 'account_opened', 'first_transaction', 'loan_approved', 'card_approved'],
      message: 'Invalid conversion goal'
    }
  }],
  attributionWindow: {
    type: Number,
    required: [true, 'Attribution window is required'],
    min: [1, 'Attribution window must be at least 1 day'],
    max: [90, 'Attribution window cannot exceed 90 days'],
    default: 30
  }
}, { _id: false });

const AffiliatePartnerSchema = new Schema<IAffiliatePartner>({
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    trim: true,
    maxlength: [100, 'Partner name cannot exceed 100 characters'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Partner type is required'],
    enum: {
      values: ['loan', 'credit_card', 'broker'],
      message: 'Partner type must be loan, credit_card, or broker'
    },
    index: true
  },
  apiEndpoint: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'API endpoint must be a valid URL'
    }
  },
  commissionStructure: {
    type: CommissionStructureSchema,
    required: [true, 'Commission structure is required']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  logoUrl: {
    type: String,
    required: [true, 'Logo URL is required'],
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v);
      },
      message: 'Logo URL must be a valid image URL'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    required: [true, 'Website URL is required'],
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  trackingConfig: {
    type: TrackingConfigSchema,
    required: [true, 'Tracking configuration is required']
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
AffiliatePartnerSchema.index({ name: 1, type: 1 });
AffiliatePartnerSchema.index({ isActive: 1, type: 1 });
AffiliatePartnerSchema.index({ createdAt: -1 });

// Virtual for product count
AffiliatePartnerSchema.virtual('productCount').get(function() {
  return this.products ? this.products.length : 0;
});

// Pre-save middleware to update the updatedAt field
AffiliatePartnerSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static method to find active partners
AffiliatePartnerSchema.statics.findActive = function(type?: string) {
  const filter: any = { isActive: true };
  if (type) {
    filter.type = type;
  }
  return this.find(filter).populate('products');
};

// Static method to find by type
AffiliatePartnerSchema.statics.findByType = function(type: string) {
  return this.find({ type, isActive: true }).populate('products');
};

// Instance method to add product
AffiliatePartnerSchema.methods.addProduct = function(productId: string) {
  if (!this.products.includes(productId)) {
    this.products.push(productId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove product
AffiliatePartnerSchema.methods.removeProduct = function(productId: string) {
  this.products = this.products.filter(id => id.toString() !== productId.toString());
  return this.save();
};

// Instance method to calculate commission
AffiliatePartnerSchema.methods.calculateCommission = function(baseAmount: number): number {
  const { type, amount } = this.commissionStructure;
  
  if (type === 'fixed') {
    return amount;
  } else if (type === 'percentage') {
    return (baseAmount * amount) / 100;
  }
  
  return 0;
};

const AffiliatePartner = mongoose.models.AffiliatePartner || mongoose.model<IAffiliatePartner>('AffiliatePartner', AffiliatePartnerSchema);

export default AffiliatePartner;
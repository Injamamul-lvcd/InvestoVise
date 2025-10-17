import mongoose, { Schema } from 'mongoose';
import { IAffiliateClick } from '@/types/database';

const AffiliateClickSchema = new Schema<IAffiliateClick>({
  trackingId: {
    type: String,
    required: [true, 'Tracking ID is required'],
    unique: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9-_]{10,50}$/.test(v);
      },
      message: 'Tracking ID must be alphanumeric with hyphens/underscores, 10-50 characters'
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'AffiliatePartner',
    required: [true, 'Partner ID is required'],
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  clickedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Click timestamp is required'],
    index: true
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    validate: {
      validator: function(v: string) {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required'],
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  referrer: {
    type: String,
    maxlength: [500, 'Referrer cannot exceed 500 characters'],
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Referrer must be a valid URL'
    }
  },
  converted: {
    type: Boolean,
    default: false,
    index: true
  },
  conversionDate: {
    type: Date,
    index: true,
    validate: {
      validator: function(v: Date) {
        return !v || v >= this.clickedAt;
      },
      message: 'Conversion date cannot be before click date'
    }
  },
  commissionAmount: {
    type: Number,
    min: [0, 'Commission amount cannot be negative'],
    validate: {
      validator: function(v: number) {
        return !v || this.converted;
      },
      message: 'Commission amount can only be set for converted clicks'
    }
  },
  sessionId: {
    type: String,
    maxlength: [100, 'Session ID cannot exceed 100 characters'],
    index: true
  },
  utmSource: {
    type: String,
    maxlength: [100, 'UTM source cannot exceed 100 characters'],
    index: true
  },
  utmMedium: {
    type: String,
    maxlength: [100, 'UTM medium cannot exceed 100 characters'],
    index: true
  },
  utmCampaign: {
    type: String,
    maxlength: [100, 'UTM campaign cannot exceed 100 characters'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
AffiliateClickSchema.index({ partnerId: 1, clickedAt: -1 });
AffiliateClickSchema.index({ productId: 1, clickedAt: -1 });
AffiliateClickSchema.index({ userId: 1, clickedAt: -1 });
AffiliateClickSchema.index({ converted: 1, conversionDate: -1 });
AffiliateClickSchema.index({ clickedAt: -1, converted: 1 });
AffiliateClickSchema.index({ utmSource: 1, utmMedium: 1, utmCampaign: 1 });

// TTL index to automatically delete old click data after 2 years
AffiliateClickSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Virtual for time to conversion
AffiliateClickSchema.virtual('timeToConversion').get(function() {
  if (!this.converted || !this.conversionDate) return null;
  
  const timeDiff = this.conversionDate.getTime() - this.clickedAt.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${(hours % 24) > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
});

// Virtual for conversion status
AffiliateClickSchema.virtual('status').get(function() {
  if (this.converted) return 'converted';
  
  const now = new Date();
  const daysSinceClick = Math.floor((now.getTime() - this.clickedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceClick > 30) return 'expired';
  return 'pending';
});

// Pre-save middleware to validate conversion data
AffiliateClickSchema.pre('save', function(next) {
  if (this.converted && !this.conversionDate) {
    this.conversionDate = new Date();
  }
  
  if (!this.converted) {
    this.conversionDate = undefined;
    this.commissionAmount = undefined;
  }
  
  next();
});

// Static method to generate unique tracking ID
AffiliateClickSchema.statics.generateTrackingId = function(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

// Static method to find clicks by partner
AffiliateClickSchema.statics.findByPartner = function(partnerId: string, startDate?: Date, endDate?: Date) {
  const query: any = { partnerId };
  
  if (startDate || endDate) {
    query.clickedAt = {};
    if (startDate) query.clickedAt.$gte = startDate;
    if (endDate) query.clickedAt.$lte = endDate;
  }
  
  return this.find(query)
    .populate('userId', 'email profile.firstName profile.lastName')
    .populate('productId', 'name type')
    .sort({ clickedAt: -1 });
};

// Static method to get conversion analytics
AffiliateClickSchema.statics.getConversionAnalytics = function(partnerId?: string, startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (partnerId) matchStage.partnerId = new mongoose.Types.ObjectId(partnerId);
  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = startDate;
    if (endDate) matchStage.clickedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$partnerId',
        totalClicks: { $sum: 1 },
        totalConversions: { $sum: { $cond: ['$converted', 1, 0] } },
        totalCommission: { $sum: { $cond: ['$converted', '$commissionAmount', 0] } },
        avgTimeToConversion: {
          $avg: {
            $cond: [
              '$converted',
              { $subtract: ['$conversionDate', '$clickedAt'] },
              null
            ]
          }
        }
      }
    },
    {
      $addFields: {
        conversionRate: {
          $multiply: [
            { $divide: ['$totalConversions', '$totalClicks'] },
            100
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'affiliatepartners',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    { $unwind: '$partner' }
  ]);
};

// Instance method to mark as converted
AffiliateClickSchema.methods.markAsConverted = function(commissionAmount?: number) {
  this.converted = true;
  this.conversionDate = new Date();
  if (commissionAmount !== undefined) {
    this.commissionAmount = commissionAmount;
  }
  return this.save();
};

// Instance method to check if click is within attribution window
AffiliateClickSchema.methods.isWithinAttributionWindow = async function(): Promise<boolean> {
  const partner = await mongoose.model('AffiliatePartner').findById(this.partnerId);
  if (!partner) return false;
  
  const now = new Date();
  const daysSinceClick = Math.floor((now.getTime() - this.clickedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceClick <= partner.trackingConfig.attributionWindow;
};

const AffiliateClick = mongoose.models.AffiliateClick || mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);

export default AffiliateClick;
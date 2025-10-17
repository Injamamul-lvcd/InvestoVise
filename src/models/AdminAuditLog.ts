import mongoose, { Schema } from 'mongoose';
import { IAdminAuditLog } from '@/types/database';

const AdminAuditLogSchema = new Schema<IAdminAuditLog>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin ID is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'login',
      'logout',
      'user_create',
      'user_update',
      'user_delete',
      'user_role_change',
      'partner_create',
      'partner_update',
      'partner_delete',
      'product_create',
      'product_update',
      'product_delete',
      'article_create',
      'article_update',
      'article_delete',
      'article_publish',
      'article_unpublish',
      'commission_update',
      'settings_update',
      'data_export',
      'bulk_operation',
      'system_maintenance'
    ],
    index: true
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    enum: ['user', 'admin', 'partner', 'product', 'article', 'commission', 'settings', 'system'],
    index: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    required: [true, 'Details are required']
  },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
    index: true
  },
  errorMessage: {
    type: String
  },
  duration: {
    type: Number // in milliseconds
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and querying
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
AdminAuditLogSchema.index({ resource: 1, resourceId: 1 });
AdminAuditLogSchema.index({ severity: 1, createdAt: -1 });
AdminAuditLogSchema.index({ status: 1, createdAt: -1 });
AdminAuditLogSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
AdminAuditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Static method to log admin action
AdminAuditLogSchema.statics.logAction = function(logData: Partial<IAdminAuditLog>) {
  return this.create({
    ...logData,
    createdAt: new Date()
  });
};

// Static method to get audit trail for resource
AdminAuditLogSchema.statics.getResourceAuditTrail = function(resource: string, resourceId: string, limit = 50) {
  return this.find({
    resource,
    resourceId
  })
  .populate('adminId', 'email profile.firstName profile.lastName')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get admin activity summary
AdminAuditLogSchema.statics.getAdminActivitySummary = function(adminId: string, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        adminId: new mongoose.Types.ObjectId(adminId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.action': 1 }
    }
  ]);
};

// Static method to cleanup old logs (keep for 1 year)
AdminAuditLogSchema.statics.cleanupOldLogs = function() {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: oneYearAgo },
    severity: { $nin: ['high', 'critical'] }
  });
};

const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);

export default AdminAuditLog;
import mongoose, { Schema } from 'mongoose';
import { IAdminSession } from '@/types/database';

const AdminSessionSchema = new Schema<IAdminSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    index: true
  },
  refreshToken: {
    type: String,
    required: [true, 'Refresh token is required'],
    unique: true,
    select: false
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true
  },
  loginMethod: {
    type: String,
    enum: ['password', 'mfa'],
    default: 'password'
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and cleanup
AdminSessionSchema.index({ userId: 1, isActive: 1 });
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AdminSessionSchema.index({ lastActivity: -1 });

// Virtual for session duration
AdminSessionSchema.virtual('duration').get(function() {
  return this.lastActivity.getTime() - this.createdAt.getTime();
});

// Instance method to update activity
AdminSessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to invalidate session
AdminSessionSchema.methods.invalidate = function() {
  this.isActive = false;
  return this.save();
};

// Static method to cleanup expired sessions
AdminSessionSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days old inactive sessions
    ]
  });
};

// Static method to find active sessions for user
AdminSessionSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
};

const AdminSession = mongoose.models.AdminSession || mongoose.model<IAdminSession>('AdminSession', AdminSessionSchema);

export default AdminSession;
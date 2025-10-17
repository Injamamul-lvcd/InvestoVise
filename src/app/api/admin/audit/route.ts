import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { connectToDatabase } from '@/lib/database';
import AdminAuditLog from '@/models/AdminAuditLog';
import mongoose from 'mongoose';

async function getAuditLogsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const adminId = url.searchParams.get('adminId');
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query
    const query: any = {};

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      query.adminId = new mongoose.Types.ObjectId(adminId);
    }

    if (action) {
      query.action = action;
    }

    if (resource) {
      query.resource = resource;
    }

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get audit logs with pagination
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query)
        .populate('adminId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminAuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get summary statistics
    const summaryPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          highCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
        }
      }
    ];

    const [summary] = await AdminAuditLog.aggregate(summaryPipeline);

    return NextResponse.json(
      {
        message: 'Audit logs retrieved successfully',
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        summary: summary || {
          totalActions: 0,
          successCount: 0,
          failureCount: 0,
          criticalCount: 0,
          highCount: 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get audit logs error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to retrieve audit logs',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function getAuditStatsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const adminId = url.searchParams.get('adminId');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build base match query
    const matchQuery: any = {
      createdAt: { $gte: startDate }
    };

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      matchQuery.adminId = new mongoose.Types.ObjectId(adminId);
    }

    // Get activity by day
    const dailyActivityPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
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
      { $sort: { '_id': 1 } }
    ];

    // Get activity by action
    const actionActivityPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];

    // Get activity by admin (if not filtering by specific admin)
    let adminActivityPipeline = null;
    if (!adminId) {
      adminActivityPipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: '$adminId',
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
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'admin'
          }
        },
        {
          $unwind: '$admin'
        },
        {
          $project: {
            _id: 1,
            count: 1,
            successCount: 1,
            failureCount: 1,
            email: '$admin.email',
            name: {
              $concat: ['$admin.profile.firstName', ' ', '$admin.profile.lastName']
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ];
    }

    // Execute aggregations
    const [dailyActivity, actionActivity, adminActivity] = await Promise.all([
      AdminAuditLog.aggregate(dailyActivityPipeline),
      AdminAuditLog.aggregate(actionActivityPipeline),
      adminActivityPipeline ? AdminAuditLog.aggregate(adminActivityPipeline) : Promise.resolve([])
    ]);

    return NextResponse.json(
      {
        message: 'Audit statistics retrieved successfully',
        stats: {
          dailyActivity,
          actionActivity,
          adminActivity,
          period: {
            days,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
          }
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get audit stats error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to retrieve audit statistics',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('audit_view', 'system', 'low')(getAuditLogsHandler)
);

// Add a separate endpoint for statistics
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  if (body.action === 'stats') {
    return requireAdmin(
      logAdminAction('audit_stats', 'system', 'low')(getAuditStatsHandler)
    )(request);
  }
  
  return NextResponse.json(
    {
      error: {
        code: 'INVALID_ACTION',
        message: 'Invalid action specified',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 400 }
  );
}
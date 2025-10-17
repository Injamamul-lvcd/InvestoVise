import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { createAdminUser } from '@/lib/services/adminAuth';

async function getUsersHandler(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const verified = url.searchParams.get('verified');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (verified !== null && verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    // Get users with pagination
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-hashedPassword -verificationToken -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        message: 'Users retrieved successfully',
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get users error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to retrieve users',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function createUserHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = (request as any).admin;
    const body = await request.json();
    const { email, password, firstName, lastName, role = 'user' } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, first name, and last name are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let result;
    if (role === 'admin') {
      // Create admin user
      result = await createAdminUser(
        { email, password, firstName, lastName },
        admin.userId,
        { ipAddress, userAgent }
      );
    } else {
      // Create regular user
      await connectToDatabase();

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          {
            error: {
              code: 'USER_EXISTS',
              message: 'User with this email already exists',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        );
      }

      const user = new User({
        email,
        hashedPassword: password,
        profile: { firstName, lastName },
        role: 'user',
        isVerified: true, // Admin-created users are verified by default
      });

      await user.save();

      result = {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          profile: user.profile,
          role: user.role,
          createdAt: user.createdAt,
        },
      };
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_CREATION_FAILED',
            message: result.error || 'Failed to create user',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: result.admin || result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to create user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('user_list', 'user', 'low')(getUsersHandler)
);

export const POST = requireAdmin(
  logAdminAction('user_create', 'user', 'high')(createUserHandler)
);
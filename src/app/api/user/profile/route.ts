import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { UserProfile, UserPreferences } from '@/types/database';

interface UpdateProfileRequest {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

async function getProfileHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();

    const user = await User.findById(request.user?.userId);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Prepare user response
    const userResponse = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      fullName: user.fullName,
      age: user.age,
    };

    return NextResponse.json(
      {
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve profile. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function updateProfileHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body: UpdateProfileRequest = await request.json();
    const { profile, preferences } = body;

    await connectToDatabase();

    const user = await User.findById(request.user?.userId);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Update profile fields if provided
    if (profile) {
      // Validate and update profile fields
      const allowedProfileFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'phone',
        'city',
        'state',
        'occupation',
        'annualIncome',
      ];

      for (const [key, value] of Object.entries(profile)) {
        if (allowedProfileFields.includes(key) && value !== undefined) {
          (user.profile as any)[key] = value;
        }
      }
    }

    // Update preferences if provided
    if (preferences) {
      const allowedPreferenceFields = [
        'newsletter',
        'marketUpdates',
        'productRecommendations',
        'language',
        'investmentExperience',
        'riskTolerance',
      ];

      for (const [key, value] of Object.entries(preferences)) {
        if (allowedPreferenceFields.includes(key) && value !== undefined) {
          (user.preferences as any)[key] = value;
        }
      }
    }

    // Save updated user
    await user.save();

    // Log profile update activity
    await user.addActivity('login', {
      type: 'profile_update',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      updatedFields: {
        profile: profile ? Object.keys(profile) : [],
        preferences: preferences ? Object.keys(preferences) : [],
      },
    });

    // Prepare updated user response
    const userResponse = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      fullName: user.fullName,
      age: user.age,
    };

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);

    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data provided',
            details: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Profile update failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = requireAuth(getProfileHandler);
export const PUT = requireAuth(updateProfileHandler);
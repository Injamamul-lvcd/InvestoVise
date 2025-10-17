import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { generateTokens, generateVerificationToken, validatePassword, validateEmail } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/auth';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

async function registerHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, firstName, lastName, phone } = body;

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

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password does not meet security requirements',
            details: passwordValidation.errors,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create new user
    const newUser = new User({
      email: email.toLowerCase().trim(),
      hashedPassword: password, // Will be hashed by pre-save middleware
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim(),
      },
      verificationToken,
      isVerified: false, // Require email verification
    });

    await newUser.save();

    // Generate tokens
    const tokens = generateTokens(newUser);

    // Log registration activity
    await newUser.addActivity('login', {
      type: 'registration',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    // Return success response (excluding sensitive data)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      profile: newUser.profile,
      preferences: newUser.preferences,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        user: userResponse,
        tokens,
        verificationRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user data provided',
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
          message: 'Registration failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 registrations per 15 minutes per IP)
export const POST = rateLimit(5, 15 * 60 * 1000)(registerHandler);
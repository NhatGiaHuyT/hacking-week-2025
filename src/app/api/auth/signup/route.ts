import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { handleApiError, validateRequired, validateEmail, validateStringLength } from '../../../../lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    validateRequired(name, 'Name');
    validateRequired(email, 'Email');
    validateRequired(password, 'Password');

    // Validate email format
    validateEmail(email);

    // Validate password length
    validateStringLength(password, 'Password', 6, 100);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
          code: 'USER_ALREADY_EXISTS'
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user
      },
      { status: 201 }
    );

  } catch (error) {
    return handleApiError(error);
  }
}

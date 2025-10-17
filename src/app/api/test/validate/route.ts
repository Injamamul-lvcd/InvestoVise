import { NextRequest, NextResponse } from 'next/server';
import { testModels } from '@/lib/test-models';

export async function GET(request: NextRequest) {
  try {
    await testModels();
    
    return NextResponse.json({
      status: 'success',
      message: 'All model validations passed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Model validation test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Model validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
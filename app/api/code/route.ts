import { NextRequest, NextResponse } from 'next/server';
import { generateCode } from '@/lib/ai/coder';
import { VibeBlueprint } from '@/types/vibeblueprint';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blueprint } = body;

    if (!blueprint) {
      return NextResponse.json(
        { error: 'Missing blueprint' },
        { status: 400 }
      );
    }

    const result = await generateCode(blueprint as VibeBlueprint);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Code generation API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

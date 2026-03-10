import { NextRequest, NextResponse } from 'next/server';
import { translateVibeToBlueprint } from '@/lib/ai/translator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vibe_description } = body;

    if (!vibe_description || typeof vibe_description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid vibe_description' },
        { status: 400 }
      );
    }

    const result = await translateVibeToBlueprint(vibe_description);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translate API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

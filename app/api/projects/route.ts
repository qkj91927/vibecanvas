import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { VibeBlueprint } from '@/types/vibeblueprint';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured. Please set Supabase environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { user_id, blueprint, code_artifact, parent_id } = body;

    if (!user_id || !blueprint || !code_artifact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id,
        blueprint,
        code_artifact,
        parent_id: parent_id || null,
        remix_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured. Please set Supabase environment variables.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, projects: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

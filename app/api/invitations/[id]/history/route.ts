import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('tuhfa_token')?.value;
  return authHeader?.replace('Bearer ', '') || cookieToken || null;
}

async function requireAuth(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('design_history')
    .select('*')
    .eq('invitation_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ history: data });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('design_history')
    .insert({
      invitation_id: params.id,
      elements: body.elements || [],
      snapshot_name: body.snapshot_name || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: data }, { status: 201 });
}

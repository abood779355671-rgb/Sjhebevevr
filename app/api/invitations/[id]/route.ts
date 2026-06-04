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
    .from('invitations')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'الدعوة غير موجودة' }, { status: 404 });

  return NextResponse.json({ invitation: data });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    'title', 'bride_name', 'groom_name', 'event_date', 'event_time',
    'venue_name', 'venue_address', 'venue_lat', 'venue_lng',
    'template_id', 'elements', 'canvas_width', 'canvas_height',
    'background_color', 'password', 'expires_at', 'is_active', 'music_url',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabaseAdmin
    .from('invitations')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invitation: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('invitations')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

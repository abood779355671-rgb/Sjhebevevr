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

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const url = new URL(request.url);
  const invitationId = url.searchParams.get('invitation_id');

  let query = supabaseAdmin.from('guests').select('*').order('created_at', { ascending: false });
  if (invitationId) query = query.eq('invitation_id', invitationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ guests: data });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('guests')
    .insert({
      invitation_id: body.invitation_id,
      name: body.name || '',
      phone: body.phone || '',
      email: body.email || '',
      group_name: body.group_name || '',
      notes: body.notes || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guest: data }, { status: 201 });
}

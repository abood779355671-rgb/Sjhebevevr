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

  let query = supabaseAdmin.from('rsvp_responses').select('*').order('created_at', { ascending: false });
  if (invitationId) query = query.eq('invitation_id', invitationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ responses: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.invitation_id || !body.guest_name) {
    return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
  }

  const { data: inv } = await supabaseAdmin
    .from('invitations')
    .select('id, is_active, expires_at, password')
    .eq('id', body.invitation_id)
    .maybeSingle();

  if (!inv || !inv.is_active) {
    return NextResponse.json({ error: 'الدعوة غير متاحة' }, { status: 404 });
  }

  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: 'انتهت صلاحية الدعوة' }, { status: 410 });
  }

  const { data, error } = await supabaseAdmin
    .from('rsvp_responses')
    .insert({
      invitation_id: body.invitation_id,
      guest_name: body.guest_name,
      phone: body.phone || '',
      email: body.email || '',
      attendance_status: body.attendance_status || 'attending',
      companions_count: body.companions_count || 0,
      notes: body.notes || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ response: data }, { status: 201 });
}

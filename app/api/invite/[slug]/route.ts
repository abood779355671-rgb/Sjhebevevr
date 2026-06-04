import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'الدعوة غير موجودة' }, { status: 404 });

  if (!data.is_active) {
    return NextResponse.json({ error: 'الدعوة غير متاحة' }, { status: 403 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'انتهت صلاحية الدعوة' }, { status: 410 });
  }

  const { password: _pwd, ...publicData } = data;
  const hasPassword = !!data.password;

  return NextResponse.json({ invitation: publicData, hasPassword });
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const body = await request.json();

  const { data } = await supabaseAdmin
    .from('invitations')
    .select('password, views_count')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'الدعوة غير موجودة' }, { status: 404 });

  if (data.password && body.password !== data.password) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 403 });
  }

  await supabaseAdmin
    .from('invitations')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('slug', params.slug);

  return NextResponse.json({ success: true });
}

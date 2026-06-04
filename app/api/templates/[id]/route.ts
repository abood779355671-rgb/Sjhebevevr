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
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 });

  return NextResponse.json({ template: data });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  const allowed = ['name', 'description', 'color_scheme', 'font_family', 'elements', 'thumbnail_url', 'canvas_width', 'canvas_height'];
  for (const f of allowed) {
    if (f in body) updateData[f] = body[f];
  }

  const { data, error } = await supabaseAdmin
    .from('templates')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: tmpl } = await supabaseAdmin.from('templates').select('is_custom').eq('id', params.id).maybeSingle();
  if (!tmpl?.is_custom) {
    return NextResponse.json({ error: 'لا يمكن حذف القوالب الأساسية' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from('templates').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

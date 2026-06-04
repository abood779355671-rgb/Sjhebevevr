import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { getBuiltinTemplates } from '@/lib/templates';

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

  const { data: existing, error: countError } = await supabaseAdmin
    .from('templates')
    .select('id')
    .eq('is_custom', false)
    .limit(1);

  if (!countError && (!existing || existing.length === 0)) {
    const builtins = getBuiltinTemplates();
    await supabaseAdmin.from('templates').insert(builtins);
  }

  const { data, error } = await supabaseAdmin
    .from('templates')
    .select('*')
    .order('design_key', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: data });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('templates')
    .insert({
      name: body.name || 'قالب مخصص',
      description: body.description || '',
      design_key: body.design_key || 1,
      color_scheme: body.color_scheme || 'gold-white',
      font_family: body.font_family || 'Amiri',
      thumbnail_url: body.thumbnail_url || '',
      elements: body.elements || [],
      canvas_width: body.canvas_width || 800,
      canvas_height: body.canvas_height || 1200,
      is_custom: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ template: data }, { status: 201 });
}

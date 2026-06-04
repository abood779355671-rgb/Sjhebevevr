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

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 10; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invitations: data });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const slug = generateSlug();

  const { data, error } = await supabaseAdmin
    .from('invitations')
    .insert({
      slug,
      title: body.title || 'دعوة زواج',
      bride_name: body.bride_name || '',
      groom_name: body.groom_name || '',
      event_date: body.event_date || null,
      event_time: body.event_time || '',
      venue_name: body.venue_name || '',
      venue_address: body.venue_address || '',
      venue_lat: body.venue_lat || null,
      venue_lng: body.venue_lng || null,
      template_id: body.template_id || null,
      elements: body.elements || [],
      canvas_width: body.canvas_width || 800,
      canvas_height: body.canvas_height || 1200,
      background_color: body.background_color || '#FFFDF5',
      password: body.password || null,
      expires_at: body.expires_at || null,
      music_url: body.music_url || '',
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invitation: data }, { status: 201 });
}

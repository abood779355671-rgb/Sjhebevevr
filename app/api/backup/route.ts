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

  const [invitations, templates, guests, rsvp] = await Promise.all([
    supabaseAdmin.from('invitations').select('*'),
    supabaseAdmin.from('templates').select('*').eq('is_custom', true),
    supabaseAdmin.from('guests').select('*'),
    supabaseAdmin.from('rsvp_responses').select('*'),
  ]);

  const backupData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      invitations: invitations.data || [],
      templates: templates.data || [],
      guests: guests.data || [],
      rsvp_responses: rsvp.data || [],
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonString);

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tuhfa-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();

  if (!body.data) {
    return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح' }, { status: 400 });
  }

  const results = { invitations: 0, templates: 0, guests: 0, rsvp: 0, errors: [] as string[] };

  if (body.data.templates?.length) {
    const customTemplates = body.data.templates.filter((t: { is_custom: boolean }) => t.is_custom);
    if (customTemplates.length) {
      const { error } = await supabaseAdmin.from('templates').upsert(customTemplates, { onConflict: 'id' });
      if (error) results.errors.push(`قوالب: ${error.message}`);
      else results.templates = customTemplates.length;
    }
  }

  if (body.data.invitations?.length) {
    const { error } = await supabaseAdmin.from('invitations').upsert(body.data.invitations, { onConflict: 'id' });
    if (error) results.errors.push(`دعوات: ${error.message}`);
    else results.invitations = body.data.invitations.length;
  }

  return NextResponse.json({ success: true, results });
}

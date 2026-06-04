import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.invitation_id) {
    return NextResponse.json({ error: 'invitation_id مطلوب' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  const userAgent = request.headers.get('user-agent') || '';

  if (body.event_type === 'view') {
    const { data: inv } = await supabaseAdmin
      .from('invitations')
      .select('views_count')
      .eq('id', body.invitation_id)
      .maybeSingle();

    if (inv) {
      await supabaseAdmin
        .from('invitations')
        .update({ views_count: (inv.views_count || 0) + 1 })
        .eq('id', body.invitation_id);
    }
  }

  const { error } = await supabaseAdmin.from('analytics').insert({
    invitation_id: body.invitation_id,
    event_type: body.event_type || 'view',
    ip_address: ip.split(',')[0].trim(),
    user_agent: userAgent,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const invitationId = url.searchParams.get('invitation_id');

  if (!invitationId) {
    return NextResponse.json({ error: 'invitation_id مطلوب' }, { status: 400 });
  }

  const { data: views } = await supabaseAdmin
    .from('analytics')
    .select('event_type, created_at')
    .eq('invitation_id', invitationId);

  const { data: rsvp } = await supabaseAdmin
    .from('rsvp_responses')
    .select('attendance_status')
    .eq('invitation_id', invitationId);

  const stats = {
    totalViews: views?.filter((v) => v.event_type === 'view').length || 0,
    attending: rsvp?.filter((r) => r.attendance_status === 'attending').length || 0,
    notAttending: rsvp?.filter((r) => r.attendance_status === 'not_attending').length || 0,
    maybe: rsvp?.filter((r) => r.attendance_status === 'maybe').length || 0,
    shares: views?.filter((v) => v.event_type === 'share').length || 0,
  };

  return NextResponse.json({ stats });
}

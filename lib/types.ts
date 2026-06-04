export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'qrcode'
  | 'countdown'
  | 'divider'
  | 'ornament';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  flipX: boolean;
  flipY: boolean;
  zIndex: number;
  name: string;
  content?: string;
  src?: string;
  styles?: ElementStyles;
  shapeType?: 'rectangle' | 'circle' | 'line' | 'diamond';
  ornamentType?: string;
}

export interface ElementStyles {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'right' | 'center' | 'left';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: string;
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface InvitationData {
  id: string;
  slug: string;
  title: string;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  event_time: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number | null;
  venue_lng: number | null;
  template_id: string | null;
  elements: CanvasElement[];
  canvas_width: number;
  canvas_height: number;
  background_color: string;
  password: string | null;
  expires_at: string | null;
  is_active: boolean;
  views_count: number;
  music_url: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  design_key: number;
  color_scheme: string;
  font_family: string;
  thumbnail_url: string;
  elements: CanvasElement[];
  canvas_width: number;
  canvas_height: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestData {
  id: string;
  invitation_id: string;
  name: string;
  phone: string;
  email: string;
  group_name: string;
  notes: string;
  created_at: string;
}

export interface RsvpData {
  id: string;
  invitation_id: string;
  guest_name: string;
  phone: string;
  email: string;
  attendance_status: 'attending' | 'not_attending' | 'maybe';
  companions_count: number;
  notes: string;
  created_at: string;
}

export interface DesignHistoryEntry {
  id: string;
  invitation_id: string;
  elements: CanvasElement[];
  snapshot_name: string;
  created_at: string;
}

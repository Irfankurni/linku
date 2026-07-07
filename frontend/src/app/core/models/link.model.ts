export interface Link {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  type: LinkType;
  position: number;
  is_active: boolean;
  is_featured: boolean;
  meta: Record<string, unknown>;
  click_count: number;
  created_at: number;
  updated_at: number;
}

export type LinkType = 'link' | 'header' | 'divider' | 'embed';

export interface CreateLinkDto {
  title: string;
  url: string;
  description?: string;
  icon_url?: string | null;
  type?: LinkType;
  is_featured?: boolean;
  meta?: Record<string, unknown>;
}

export type UpdateLinkDto = Partial<CreateLinkDto>;

export interface Product {
  id:          string;
  user_id:     string;
  title:       string;
  description: string | null;
  price:       number | null;
  currency:    string;
  images:      string[];
  buy_url:     string | null;
  category:    string | null;
  slug:        string;
  is_active:   boolean;
  is_featured: boolean;
  stock:       number | null;
  meta:        Record<string, unknown>;
  view_count:  number;
  position:    number;
  created_at:  number;
  updated_at:  number;
}

export interface CreateProductDto {
  title:        string;
  description?: string;
  price?:       number | null;
  currency?:    string;
  images?:      string[];
  buy_url?:     string | null;
  category?:    string | null;
  slug:         string;
  stock?:       number | null;
  is_featured?: boolean;
  meta?:        Record<string, unknown>;
}

export type UpdateProductDto = Partial<CreateProductDto>;

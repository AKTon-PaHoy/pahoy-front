export interface Gig {
  id: string; // UUID
  talent: string; // UUID
  name: string;
  description: string;
  gig_front_img?: string | null; // URI or null
  gig_secong_img?: string | null; // URI or null
  gig_third_img?: string | null; // URI or null
  price: number;
  price_type: "Fijo" | "Horas";
  is_active: boolean;
  tags?: string[] | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

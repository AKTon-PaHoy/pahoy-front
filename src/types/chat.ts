export interface ChatRoom {
  id: string;
  name: string;
  participants: string[]; // UUID[]
  participant_names: string[];
  last_message: string | null;
  client_user: string; // UUID
  gig: string; // UUID
  is_active: boolean;
  created_at: string; // ISO datetime
}

export interface Message {
  id: string; // UUID
  room: string; // UUID
  contract: string | null; // UUID or null
  sender: string; // UUID
  sender_username: string;
  content: string;
  attachment: string | null; // URI or null
  timestamp: string; // ISO datetime
}

export interface Contract {
  id: string;
  gig: string;
  client: string;
  status: "Activo" | "Concluido" | "Confirmado" | "Disputa" | "Cancelado" | "Propuesta";
  price: number;
  price_type: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

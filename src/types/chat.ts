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
  client_username: string | null;
  talent_username: string | null;
  status: "Activo" | "Concluido" | "Confirmado" | "Disputa" | "Cancelado" | "Propuesta";
  price: number | null;
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

export interface ContractListItem extends Contract {
  gig_name: string;
  gig_front_image: string | null;
  counterparty_name: string;
  counterparty_verified: boolean;
  counterparty_profile_pic: string | null;
}

export interface GigDetail {
  id: string;
  name: string;
  description: string;
  price: number | null;
  price_type: string;
  front_image: string | null;
  talent: string; // UUID
  talent_info: {
    first_name: string;
    last_name: string;
    is_verified: boolean;
    rating: number | null;
    profile_picture: string | null;
  };
}

export interface CreateContractPayload {
  gig: string; // UUID
  price: number;
  price_type: "Fijo" | "Horas";
}

export const CONTRACT_TIMELINE_STEPS = [
  { key: "Propuesta", label: "Propuesta enviada" },
  { key: "Activo", label: "Contrato activo" },
  { key: "Confirmado", label: "Trabajo confirmado" },
  { key: "Concluido", label: "Concluido" },
] as const;

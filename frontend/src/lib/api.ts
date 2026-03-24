import axios from "axios";

// Configure axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true, // Enable cookies for session tracking
  headers: {
    "Content-Type": "application/json",
  },
});

// TypeScript interfaces
export interface Haiku {
  id: number;
  content: string;
  author_name: string;
  vote_count: number;
  created_at?: string;
}

export interface HttpCode {
  id: number;
  code: number;
  description: string;
  category: string;
  top_haiku?: Haiku | null;
}

export interface HttpCodeDetail extends HttpCode {
  haikus: Haiku[];
}

export interface CreateHaikuRequest {
  http_code: number;
  content: string;
  author_name?: string;
}

// API methods
export const httpCodesApi = {
  // Get all HTTP codes with their top haiku
  getAll: async (): Promise<HttpCode[]> => {
    const response = await api.get("/api/v1/http_codes");
    return response.data.http_codes;
  },

  // Get a specific HTTP code with top 20 haikus
  getByCode: async (code: number): Promise<HttpCodeDetail> => {
    const response = await api.get(`/api/v1/http_codes/${code}`);
    return response.data.http_code;
  },
};

export const haikusApi = {
  // Create a new haiku
  create: async (data: CreateHaikuRequest): Promise<Haiku> => {
    const response = await api.post("/api/v1/haikus", { haiku: data });
    return response.data.haiku;
  },

  // Vote on a haiku
  vote: async (haikuId: number): Promise<Haiku> => {
    const response = await api.post(`/api/v1/haikus/${haikuId}/vote`);
    return response.data.haiku;
  },
};

export default api;

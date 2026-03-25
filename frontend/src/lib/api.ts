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
export interface User {
  id: number;
  email: string;
  username: string;
}

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

export interface DailyHaiku extends Haiku {
  http_code: {
    code: number;
    description: string;
  };
}

export interface CreateHaikuRequest {
  http_code: number;
  content: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
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

  // Get the haiku of the day
  getDaily: async (): Promise<DailyHaiku> => {
    const response = await api.get("/api/v1/haikus/daily");
    return response.data.haiku;
  },
};

export const authApi = {
  // Sign up a new user
  signup: async (data: SignupRequest): Promise<{ user: User }> => {
    const response = await api.post("/api/v1/users", { user: data });
    return response.data;
  },

  // Log in an existing user
  login: async (data: LoginRequest): Promise<{ user: User }> => {
    const response = await api.post("/api/v1/session", { session: data });
    return response.data;
  },

  // Log out
  logout: async (): Promise<{ message: string }> => {
    const response = await api.delete("/api/v1/session");
    return response.data;
  },

  // Get the current authenticated user
  me: async (): Promise<User> => {
    const response = await api.get("/api/v1/users/me");
    return response.data.user;
  },
};

export default api;

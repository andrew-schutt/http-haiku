import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoggedIn: !!user,
    isLoading,
    invalidateAuth: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY }),
  };
}

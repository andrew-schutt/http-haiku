import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { useAuth, AUTH_QUERY_KEY } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      navigate('/');
    },
  });

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>HTTP Haiku</h1>
          <p>Poetry for every status code</p>
          {!isLoading && (
            <nav className="auth-nav">
              {isLoggedIn ? (
                <>
                  <span className="nav-username">{user?.username}</span>
                  {user?.is_admin && (
                    <Link to="/admin" className="nav-link">
                      Admin
                    </Link>
                  )}
                  <button
                    className="nav-logout-button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                  <Link className="nav-link" to="/signup">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <main className="main">
        <div className="container">{children}</div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 HTTP Haiku. Share your code poetry.</p>
        </div>
      </footer>
    </div>
  );
}

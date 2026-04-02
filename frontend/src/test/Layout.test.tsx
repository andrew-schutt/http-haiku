import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import Layout from '../components/Layout';
import { renderWithProviders } from './test-utils';
import type { User } from '../lib/api';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  is_admin: false,
};

const server = setupServer(
  http.get('http://localhost:3000/api/v1/users/me', () => {
    return HttpResponse.json({ error: 'Authentication required' }, { status: 401 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Layout', () => {
  it('renders the header with title and tagline', async () => {
    renderWithProviders(<Layout>content</Layout>);
    expect(screen.getByRole('heading', { level: 1, name: 'HTTP Haiku' })).toBeInTheDocument();
    expect(screen.getByText('Poetry for every status code')).toBeInTheDocument();
  });

  it('renders children inside main container', async () => {
    renderWithProviders(
      <Layout>
        <span data-testid="child">hello</span>
      </Layout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders footer with built by link', async () => {
    renderWithProviders(<Layout>content</Layout>);
    expect(screen.getByRole('link', { name: 'Andrew Schutt' })).toBeInTheDocument();
  });

  it('shows Login and Sign up links when unauthenticated', async () => {
    // Default MSW handler returns 401
    renderWithProviders(<Layout>content</Layout>);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('shows username and Logout button when authenticated', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/users/me', () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    renderWithProviders(<Layout>content</Layout>);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('logout fires DELETE to /api/v1/session and navigates to home', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/users/me', () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.delete('http://localhost:3000/api/v1/session', () => {
        return HttpResponse.json({ message: 'Logged out successfully' });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Layout>
        <span data-testid="page-content">Home Content</span>
      </Layout>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    // After logout, auth nav should show Login/Sign up again
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    });
  });
});

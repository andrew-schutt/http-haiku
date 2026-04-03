import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import UserProfilePage from '../pages/UserProfilePage';
import { renderWithProviders } from './test-utils';
import type { UserProfileResponse } from '../lib/api';

const mockProfile: UserProfileResponse = {
  user: {
    id: 1,
    username: 'poetuser',
    created_at: '2025-01-15T00:00:00.000Z',
  },
  haikus: [
    {
      id: 10,
      content: 'An old silent pond\nA frog jumps into the pond\nSplash silence again',
      author_name: 'poetuser',
      vote_count: 5,
      created_at: '2025-02-01T00:00:00.000Z',
      http_code: { code: 418, description: "I'm a Teapot" },
    },
    {
      id: 11,
      content: 'Server is broken\nEverything has fallen apart\nFive hundred error',
      author_name: 'poetuser',
      vote_count: 2,
      created_at: '2025-03-10T00:00:00.000Z',
      http_code: { code: 500, description: 'Internal Server Error' },
    },
  ],
  total_votes: 7,
};

const server = setupServer(
  http.get('http://localhost:3000/api/v1/users/poetuser', () => {
    return HttpResponse.json(mockProfile);
  }),
  http.get('http://localhost:3000/api/v1/users/unknown', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
  http.get('http://localhost:3000/api/v1/users/me', () => {
    return HttpResponse.json({ error: 'Authentication required' }, { status: 401 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderProfilePage(username: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/user/:username" element={<UserProfilePage />} />
    </Routes>,
    { initialEntries: [`/user/${username}`] }
  );
}

describe('UserProfilePage', () => {
  it('renders loading state initially', () => {
    renderProfilePage('poetuser');
    expect(screen.getByText('Loading profile…')).toBeInTheDocument();
  });

  it('renders the username after data loads', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'poetuser' })).toBeInTheDocument();
    });
  });

  it('renders haiku count and total votes', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('haikus')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('votes')).toBeInTheDocument();
    });
  });

  it('renders member since date', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
      expect(screen.getByText(/January 2025/)).toBeInTheDocument();
    });
  });

  it('renders haikus with http code links', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByText("418 I'm a Teapot")).toBeInTheDocument();
      expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: "418 I'm a Teapot" });
    expect(link).toHaveAttribute('href', '/code/418');
  });

  it('renders haiku content', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      const pres = document.querySelectorAll('pre.haiku-content');
      expect(pres[0]?.textContent).toBe(
        'An old silent pond\nA frog jumps into the pond\nSplash silence again'
      );
    });
  });

  it('renders vote counts for each haiku', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByText('❤️ 5')).toBeInTheDocument();
      expect(screen.getByText('❤️ 2')).toBeInTheDocument();
    });
  });

  it('renders error state for unknown user', async () => {
    renderProfilePage('unknown');

    await waitFor(() => {
      expect(screen.getByText('Poet not found.')).toBeInTheDocument();
    });
  });

  it('renders back link to home', async () => {
    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'poetuser' })).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /Back to all codes/ });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('uses singular labels for 1 haiku and 1 vote', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/users/poetuser', () => {
        return HttpResponse.json({
          user: { id: 1, username: 'poetuser', created_at: '2025-01-15T00:00:00.000Z' },
          haikus: [
            {
              id: 10,
              content: 'An old silent pond\nA frog jumps into the pond\nSplash silence again',
              author_name: 'poetuser',
              vote_count: 1,
              created_at: '2025-02-01T00:00:00.000Z',
              http_code: { code: 418, description: "I'm a Teapot" },
            },
          ],
          total_votes: 1,
        });
      })
    );

    renderProfilePage('poetuser');

    await waitFor(() => {
      expect(screen.getByText('haiku')).toBeInTheDocument();
      expect(screen.getByText('vote')).toBeInTheDocument();
    });
  });

  it('renders empty state when user has no haikus', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/users/emptypoet', () => {
        return HttpResponse.json({
          user: { id: 2, username: 'emptypoet', created_at: '2025-01-01T00:00:00.000Z' },
          haikus: [],
          total_votes: 0,
        });
      })
    );

    renderProfilePage('emptypoet');

    await waitFor(() => {
      expect(screen.getByText('No haikus submitted yet.')).toBeInTheDocument();
    });
  });
});

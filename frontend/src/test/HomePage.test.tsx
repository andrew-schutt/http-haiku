import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import HomePage from '../pages/HomePage';
import { renderWithProviders } from './test-utils';
import type { HttpCode } from '../lib/api';

const mockHttpCodes: HttpCode[] = [
  {
    id: 1,
    code: 100,
    description: 'Continue',
    category: 'informational',
    top_haiku: null,
  },
  {
    id: 2,
    code: 200,
    description: 'OK',
    category: 'success',
    top_haiku: {
      id: 10,
      content: 'All is well today\nThe request went through just fine\nTwo hundred success',
      author_name: 'Happy Poet',
      vote_count: 12,
      user_id: 1,
    },
  },
  {
    id: 3,
    code: 301,
    description: 'Moved Permanently',
    category: 'redirection',
    top_haiku: null,
  },
  {
    id: 4,
    code: 404,
    description: 'Not Found',
    category: 'client_error',
    top_haiku: null,
  },
  {
    id: 5,
    code: 500,
    description: 'Internal Server Error',
    category: 'server_error',
    top_haiku: null,
  },
];

const server = setupServer(
  http.get('http://localhost:3000/api/v1/http_codes', () => {
    return HttpResponse.json({ http_codes: mockHttpCodes });
  }),
  http.get('http://localhost:3000/api/v1/users/me', () => {
    return HttpResponse.json({ error: 'Authentication required' }, { status: 401 });
  }),
  http.get('http://localhost:3000/api/v1/haikus/daily', () => {
    return HttpResponse.json({ error: 'No haikus yet' }, { status: 404 });
  })
);

let intersectionCallback: IntersectionObserverCallback | null = null;

beforeAll(() => {
  server.listen();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        intersectionCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Loading HTTP codes...')).toBeInTheDocument();
  });

  it('renders all category sections after data loads', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('1xx Informational')).toBeInTheDocument();
    });

    expect(screen.getByText('2xx Success')).toBeInTheDocument();
    expect(screen.getByText('3xx Redirection')).toBeInTheDocument();
    expect(screen.getByText('4xx Client Error')).toBeInTheDocument();
    expect(screen.getByText('5xx Server Error')).toBeInTheDocument();
  });

  it('renders HTTP code cards within their categories', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('skips categories with no codes', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/http_codes', () => {
        // Only success codes — no informational, redirection, client_error, server_error
        return HttpResponse.json({
          http_codes: [
            { id: 2, code: 200, description: 'OK', category: 'success', top_haiku: null },
          ],
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('2xx Success')).toBeInTheDocument();
    });

    expect(screen.queryByText('1xx Informational')).not.toBeInTheDocument();
    expect(screen.queryByText('3xx Redirection')).not.toBeInTheDocument();
    expect(screen.queryByText('4xx Client Error')).not.toBeInTheDocument();
    expect(screen.queryByText('5xx Server Error')).not.toBeInTheDocument();
  });

  it('renders error state when request fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/http_codes', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load HTTP codes. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders daily haiku banner when daily haiku is available', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/haikus/daily', () => {
        return HttpResponse.json({
          haiku: {
            id: 10,
            content: 'All is well today\nThe request went through just fine\nTwo hundred success',
            author_name: 'Happy Poet',
            vote_count: 12,
            http_code: { code: 200, description: 'OK' },
          },
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('✨ Haiku of the Day')).toBeInTheDocument();
    });

    expect(screen.getByText(/HTTP 200 — OK/)).toBeInTheDocument();
  });

  it('renders the category navigation bar after data loads', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Jump to category' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '1xx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5xx' })).toBeInTheDocument();
  });

  it('highlights the active category when a section intersects', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '3xx' })).toBeInTheDocument();
    });

    const section = document.createElement('section');
    section.id = 'section-redirection';
    document.body.appendChild(section);

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true, target: section } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByRole('button', { name: '3xx' })).toHaveClass('active');

    // Non-intersecting entries should not change the active category
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: false, target: section } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByRole('button', { name: '3xx' })).toHaveClass('active');

    document.body.removeChild(section);
  });

  it('groups multiple codes under the same category correctly', async () => {
    // This test covers the branch where acc[code.category] already exists
    server.use(
      http.get('http://localhost:3000/api/v1/http_codes', () => {
        return HttpResponse.json({
          http_codes: [
            { id: 1, code: 200, description: 'OK', category: 'success', top_haiku: null },
            { id: 2, code: 201, description: 'Created', category: 'success', top_haiku: null },
          ],
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('2xx Success')).toBeInTheDocument();
    });

    // Both codes should appear under the same section
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
  });
});

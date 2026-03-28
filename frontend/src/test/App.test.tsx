import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import App from '../App';

const server = setupServer(
  http.get('http://localhost:3000/api/v1/http_codes', () => {
    return HttpResponse.json({
      http_codes: [
        {
          id: 1,
          code: 200,
          description: 'OK',
          category: 'success',
          top_haiku: null,
        },
      ],
    });
  }),
  http.get('http://localhost:3000/api/v1/http_codes/:code', () => {
    return HttpResponse.json({
      http_code: {
        id: 1,
        code: 200,
        description: 'OK',
        category: 'success',
        top_haiku: null,
        haikus: [],
      },
    });
  }),
  http.get('http://localhost:3000/api/v1/users/me', () => {
    return HttpResponse.json({ error: 'Authentication required' }, { status: 401 });
  }),
  http.get('http://localhost:3000/api/v1/haikus/daily', () => {
    return HttpResponse.json({ error: 'No haikus yet' }, { status: 404 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App', () => {
  it('renders the home page with layout on / route', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'HTTP Haiku' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2xx Success')).toBeInTheDocument();
    });
  });
});

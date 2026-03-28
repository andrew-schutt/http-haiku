import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { httpCodesApi, haikusApi, authApi } from '../lib/api';
import type { HttpCode, HttpCodeDetail, Haiku, User } from '../lib/api';

const mockHaiku: Haiku = {
  id: 1,
  content: 'Not found at all\nThe page you seek has vanished\nFour oh four you get',
  author_name: 'Test Author',
  vote_count: 5,
  user_id: 1,
  created_at: '2026-03-24T00:00:00Z',
};

const mockHttpCode: HttpCode = {
  id: 1,
  code: 404,
  description: 'Not Found',
  category: 'client_error',
  top_haiku: mockHaiku,
};

const mockHttpCodeDetail: HttpCodeDetail = {
  ...mockHttpCode,
  haikus: [mockHaiku],
};

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  is_admin: false,
};

const server = setupServer(
  http.get('http://localhost:3000/api/v1/http_codes', () => {
    return HttpResponse.json({ http_codes: [mockHttpCode] });
  }),
  http.get('http://localhost:3000/api/v1/http_codes/404', () => {
    return HttpResponse.json({ http_code: mockHttpCodeDetail });
  }),
  http.post('http://localhost:3000/api/v1/haikus', () => {
    return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
  }),
  http.post('http://localhost:3000/api/v1/haikus/1/vote', () => {
    return HttpResponse.json({ haiku: { ...mockHaiku, vote_count: 6 } });
  }),
  http.get('http://localhost:3000/api/v1/haikus/daily', () => {
    return HttpResponse.json({
      haiku: {
        ...mockHaiku,
        http_code: { code: 404, description: 'Not Found' },
      },
    });
  }),
  http.post('http://localhost:3000/api/v1/users', () => {
    return HttpResponse.json({ user: mockUser }, { status: 201 });
  }),
  http.post('http://localhost:3000/api/v1/session', () => {
    return HttpResponse.json({ user: mockUser });
  }),
  http.delete('http://localhost:3000/api/v1/session', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),
  http.get('http://localhost:3000/api/v1/users/me', () => {
    return HttpResponse.json({ user: mockUser });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('httpCodesApi', () => {
  describe('getAll', () => {
    it('returns list of http codes', async () => {
      const result = await httpCodesApi.getAll();
      expect(result).toEqual([mockHttpCode]);
    });
  });

  describe('getByCode', () => {
    it('returns http code detail', async () => {
      const result = await httpCodesApi.getByCode(404);
      expect(result).toEqual(mockHttpCodeDetail);
    });
  });
});

describe('haikusApi', () => {
  describe('create', () => {
    it('creates a haiku and returns it', async () => {
      const result = await haikusApi.create({
        http_code: 404,
        content: 'Line one\nLine two\nLine three',
      });
      expect(result).toEqual(mockHaiku);
    });
  });

  describe('vote', () => {
    it('votes on a haiku and returns updated haiku', async () => {
      const result = await haikusApi.vote(1);
      expect(result.vote_count).toBe(6);
    });
  });

  describe('getDaily', () => {
    it('returns the daily haiku with http_code info', async () => {
      const result = await haikusApi.getDaily();
      expect(result.id).toBe(mockHaiku.id);
      expect(result.http_code.code).toBe(404);
      expect(result.http_code.description).toBe('Not Found');
    });
  });
});

describe('authApi', () => {
  describe('signup', () => {
    it('signs up and returns user object', async () => {
      const result = await authApi.signup({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        password_confirmation: 'password123',
      });
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('logs in and returns user object', async () => {
      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('logs out and returns message', async () => {
      const result = await authApi.logout();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      const result = await authApi.me();
      expect(result).toEqual(mockUser);
    });
  });
});

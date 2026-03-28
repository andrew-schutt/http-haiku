import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import SignupPage from '../pages/SignupPage';
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

function renderSignupPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<div>Home Page</div>} />
    </Routes>,
    { initialEntries: ['/signup'] }
  );
}

describe('SignupPage', () => {
  it('renders all four fields (email, username, password, confirm password)', () => {
    renderSignupPage();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it("shows 'Creating account...' while pending", async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/users', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ user: mockUser }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/Email/), 'new@example.com');
    await user.type(screen.getByLabelText(/Username/), 'newuser');
    await user.type(screen.getByLabelText(/^Password/), 'password123');
    await user.type(screen.getByLabelText(/Confirm Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    });
  });

  it('redirects to / on success', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/users', () => {
        return HttpResponse.json({ user: mockUser }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/Email/), 'new@example.com');
    await user.type(screen.getByLabelText(/Username/), 'newuser');
    await user.type(screen.getByLabelText(/^Password/), 'password123');
    await user.type(screen.getByLabelText(/Confirm Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('shows joined errors array on failure', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/users', () => {
        return HttpResponse.json(
          { errors: ['Email has already been taken', 'Username has already been taken'] },
          { status: 422 }
        );
      })
    );

    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/Email/), 'existing@example.com');
    await user.type(screen.getByLabelText(/Username/), 'existinguser');
    await user.type(screen.getByLabelText(/^Password/), 'password123');
    await user.type(screen.getByLabelText(/Confirm Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(
        screen.getByText('Email has already been taken, Username has already been taken')
      ).toBeInTheDocument();
    });
  });

  it('shows fallback error when no errors array', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/users', () => {
        return HttpResponse.json({ message: 'Internal error' }, { status: 500 });
      })
    );

    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/Email/), 'new@example.com');
    await user.type(screen.getByLabelText(/Username/), 'newuser');
    await user.type(screen.getByLabelText(/^Password/), 'password123');
    await user.type(screen.getByLabelText(/Confirm Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Signup failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('has a link to the login page', () => {
    renderSignupPage();
    const loginLink = screen.getByRole('link', { name: /Log in/ });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

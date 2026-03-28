import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import HaikuCard from '../components/HaikuCard';
import { renderWithProviders } from './test-utils';
import type { Haiku } from '../lib/api';

const mockHaiku: Haiku = {
  id: 42,
  content: 'Autumn leaves fall down\nServer returns an error\nFive hundred haiku',
  author_name: 'Poet',
  vote_count: 3,
  user_id: 1,
};

const server = setupServer();

beforeAll(() => {
  server.listen();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('HaikuCard', () => {
  it('renders haiku content, author, and vote count', () => {
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
    // <pre> preserves newlines; match via textContent
    const pre = document.querySelector('pre.haiku-content');
    expect(pre?.textContent).toBe(mockHaiku.content);
    expect(screen.getByText(/Poet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3/ })).toBeInTheDocument();
  });

  it('vote button is enabled by default', () => {
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
    expect(screen.getByRole('button', { name: /❤️/ })).not.toBeDisabled();
  });

  it('disables button and sets voted state after successful vote', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/haikus/42/vote', () => {
        return HttpResponse.json({ haiku: { ...mockHaiku, vote_count: 4 } });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);

    await user.click(screen.getByRole('button', { name: /❤️/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /❤️/ })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: /❤️/ })).toHaveClass('voted');
  });

  it('shows alert with API error message on axios error with response data', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/haikus/42/vote', () => {
        return HttpResponse.json({ error: 'You have already voted' }, { status: 422 });
      })
    );

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);

    await user.click(screen.getByRole('button', { name: /❤️/ }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('You have already voted');
    });

    alertSpy.mockRestore();
  });

  it('copy button resets label to Copy link after 2 seconds', async () => {
    vi.useFakeTimers();
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy link/i }));
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: /Copy link/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('copy button writes correct URL to clipboard and shows Copied! feedback', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);

    const copyBtn = screen.getByRole('button', { name: /Copy link/i });
    await user.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/code/500`);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();
    });
    writeTextSpy.mockRestore();
  });

  it('shows fallback alert message on non-axios error', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/haikus/42/vote', () => {
        return HttpResponse.json({ something: 'else' }, { status: 500 });
      })
    );

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);

    await user.click(screen.getByRole('button', { name: /❤️/ }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to vote. Please try again.');
    });

    alertSpy.mockRestore();
  });

  describe('owner actions', () => {
    const ownerUser = { id: 1, email: 'poet@example.com', username: 'Poet' };

    it('shows edit and delete buttons when user is the owner', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        )
      );
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });
    });

    it('clicking edit enters edit mode with textarea', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('clicking cancel returns to normal view', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /❤️/ })).toBeInTheDocument();
    });

    it('saving a valid edit submits the update and exits edit mode', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.patch('http://localhost:3000/api/v1/haikus/42', () =>
          HttpResponse.json({ haiku: { ...mockHaiku, content: 'New\nContent\nHere' } })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save/i }));
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('shows client-side error when content does not have 3 lines', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'Only one line');
      await user.click(screen.getByRole('button', { name: /Save/i }));
      expect(screen.getByText('Content must have exactly 3 lines')).toBeInTheDocument();
    });

    it('shows error when save fails with API error', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.patch('http://localhost:3000/api/v1/haikus/42', () =>
          HttpResponse.json({ errors: ['Content is invalid'] }, { status: 422 })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save/i }));
      await waitFor(() => {
        expect(screen.getByText('Content is invalid')).toBeInTheDocument();
      });
    });

    it('clicking delete with confirmation triggers the delete mutation', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.delete(
          'http://localhost:3000/api/v1/haikus/42',
          () => new HttpResponse(null, { status: 204 })
        )
      );
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Delete/i }));
      await user.click(screen.getByRole('button', { name: /Delete/i }));
      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('Delete this haiku?');
      });
      confirmSpy.mockRestore();
    });

    it('does not delete when user cancels the confirm dialog', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        )
      );
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Delete/i }));
      await user.click(screen.getByRole('button', { name: /Delete/i }));
      expect(confirmSpy).toHaveBeenCalledWith('Delete this haiku?');
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      confirmSpy.mockRestore();
    });

    it('shows generic fallback when update API error has no errors array', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.patch('http://localhost:3000/api/v1/haikus/42', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      await user.click(screen.getByRole('button', { name: /Save/i }));
      await waitFor(() => {
        expect(screen.getByText('Failed to update haiku. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows API error message when delete fails with known error', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.delete('http://localhost:3000/api/v1/haikus/42', () =>
          HttpResponse.json({ error: 'Cannot delete' }, { status: 403 })
        )
      );
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Delete/i }));
      await user.click(screen.getByRole('button', { name: /Delete/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Cannot delete');
      });
      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('shows fallback error message when delete fails', async () => {
      server.use(
        http.get('http://localhost:3000/api/v1/users/me', () =>
          HttpResponse.json({ user: ownerUser })
        ),
        http.delete('http://localhost:3000/api/v1/haikus/42', () =>
          HttpResponse.json({ something: 'else' }, { status: 500 })
        )
      );
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const user = userEvent.setup();
      renderWithProviders(<HaikuCard haiku={mockHaiku} code={500} />);
      await waitFor(() => screen.getByRole('button', { name: /Delete/i }));
      await user.click(screen.getByRole('button', { name: /Delete/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to delete haiku. Please try again.');
      });
      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });
});

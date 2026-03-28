import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HttpCodeCard from '../components/HttpCodeCard';
import type { HttpCode } from '../lib/api';

const baseHttpCode: HttpCode = {
  id: 1,
  code: 404,
  description: 'Not Found',
  category: 'client_error',
  top_haiku: null,
};

const httpCodeWithHaiku: HttpCode = {
  ...baseHttpCode,
  top_haiku: {
    id: 1,
    content: 'Line one\nLine two\nLine three',
    author_name: 'Test Author',
    vote_count: 5,
    user_id: 1,
  },
};

describe('HttpCodeCard', () => {
  it('renders code number and description', () => {
    render(
      <MemoryRouter>
        <HttpCodeCard httpCode={baseHttpCode} />
      </MemoryRouter>
    );
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });

  it('links to /code/:code', () => {
    render(
      <MemoryRouter>
        <HttpCodeCard httpCode={baseHttpCode} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/code/404');
  });

  it('renders empty state when top_haiku is null', () => {
    render(
      <MemoryRouter>
        <HttpCodeCard httpCode={baseHttpCode} />
      </MemoryRouter>
    );
    expect(screen.getByText('No haikus yet. Be the first!')).toBeInTheDocument();
  });

  it('renders top haiku content when present', () => {
    render(
      <MemoryRouter>
        <HttpCodeCard httpCode={httpCodeWithHaiku} />
      </MemoryRouter>
    );
    // <pre> elements preserve newlines; use a function matcher to match the full text node
    const pre = document.querySelector('pre.haiku-content');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe('Line one\nLine two\nLine three');
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('renders empty state when top_haiku is undefined', () => {
    const codeWithNoHaiku: HttpCode = { ...baseHttpCode, top_haiku: undefined };
    render(
      <MemoryRouter>
        <HttpCodeCard httpCode={codeWithNoHaiku} />
      </MemoryRouter>
    );
    expect(screen.getByText('No haikus yet. Be the first!')).toBeInTheDocument();
  });
});

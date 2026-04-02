import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import CategoryNav from '../components/CategoryNav';
import { renderWithProviders } from './test-utils';

describe('CategoryNav', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders all five category labels', () => {
    renderWithProviders(<CategoryNav activeCategory={null} />);
    expect(screen.getByRole('button', { name: '1xx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2xx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3xx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4xx' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5xx' })).toBeInTheDocument();
  });

  it('applies active class to the matching category button', () => {
    renderWithProviders(<CategoryNav activeCategory="success" />);
    expect(screen.getByRole('button', { name: '2xx' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: '1xx' })).not.toHaveClass('active');
  });

  it('applies no active class when activeCategory is null', () => {
    renderWithProviders(<CategoryNav activeCategory={null} />);
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).not.toHaveClass('active');
    });
  });

  it('calls scrollIntoView on the correct section when a button is clicked', () => {
    const section = document.createElement('section');
    section.id = 'section-client_error';
    document.body.appendChild(section);

    renderWithProviders(<CategoryNav activeCategory={null} />);
    fireEvent.click(screen.getByRole('button', { name: '4xx' }));

    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    document.body.removeChild(section);
  });

  it('has an accessible nav label', () => {
    renderWithProviders(<CategoryNav activeCategory={null} />);
    expect(screen.getByRole('navigation', { name: 'Jump to category' })).toBeInTheDocument();
  });
});

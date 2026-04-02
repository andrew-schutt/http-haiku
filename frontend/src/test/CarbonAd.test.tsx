import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import CarbonAd from '../components/CarbonAd';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('CarbonAd', () => {
  it('renders nothing when VITE_CARBON_ADS_SERVE is not set', () => {
    vi.stubEnv('VITE_CARBON_ADS_SERVE', '');
    const { container } = render(<CarbonAd />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the container div and appends the Carbon script when serve ID is set', () => {
    vi.stubEnv('VITE_CARBON_ADS_SERVE', 'TESTSERVE');
    const { container } = render(<CarbonAd />);
    expect(container.querySelector('.carbon-ad')).toBeInTheDocument();
    const script = container.querySelector('script#_carbonads_js');
    expect(script).toBeInTheDocument();
    expect(script?.getAttribute('src')).toBe(
      '//cdn.carbonads.com/carbon.js?serve=TESTSERVE&placement=httphaiku'
    );
  });

  it('cleans up the container on unmount', () => {
    vi.stubEnv('VITE_CARBON_ADS_SERVE', 'TESTSERVE');
    const { container, unmount } = render(<CarbonAd />);
    const adContainer = container.querySelector('.carbon-ad') as HTMLElement;
    unmount();
    expect(adContainer.innerHTML).toBe('');
  });
});

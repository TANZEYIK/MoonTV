/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { getDoubanImageProxyUrl } from '@/lib/utils';

import VideoCard from '@/components/VideoCard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/lib/db.client', () => ({}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    onLoadingComplete: _onLoadingComplete,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    onLoadingComplete?: unknown;
  }) => <img {...props} alt={props.alt || ''} />,
}));

const poster =
  'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2933326871.jpg';

describe('VideoCard poster recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    Object.assign(window, { RUNTIME_CONFIG: {} });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('recovers a blocked Douban poster through the same-origin proxy once', () => {
    render(<VideoCard from='douban' title='Hope' poster={poster} />);
    const img = screen.getByAltText('Hope');
    expect(img).toHaveAttribute('src', poster);
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', getDoubanImageProxyUrl(poster));
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', getDoubanImageProxyUrl(poster));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('recovers a failed configured CDN using the original Douban URL', () => {
    localStorage.setItem('doubanImageProxyType', 'cmliussss-cdn-tencent');
    render(<VideoCard from='douban' title='Hope' poster={poster} />);
    const img = screen.getByAltText('Hope');
    expect(img.getAttribute('src')).toContain('img.doubanio.cmliussss.net');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', getDoubanImageProxyUrl(poster));
  });

  it('does not retry when the initial server-proxied image fails', () => {
    localStorage.setItem('doubanImageProxyType', 'server');
    render(<VideoCard from='douban' title='Hope' poster={poster} />);
    const img = screen.getByAltText('Hope');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', getDoubanImageProxyUrl(poster));
    expect(img).not.toHaveAttribute('data-retried');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('allows recovery again when a card receives a different poster', () => {
    const { rerender } = render(
      <VideoCard from='douban' title='Hope' poster={poster} />
    );
    fireEvent.error(screen.getByAltText('Hope'));
    const nextPoster = poster.replace('p2933326871', 'p2936709341');
    rerender(<VideoCard from='douban' title='New show' poster={nextPoster} />);
    const img = screen.getByAltText('New show');
    expect(img).not.toHaveAttribute('data-retried');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', getDoubanImageProxyUrl(nextPoster));
  });

  it('keeps provider images on their existing retry path', () => {
    const providerPoster = 'https://provider.example/poster.jpg';
    render(
      <VideoCard from='douban' title='Provider' poster={providerPoster} />
    );
    const img = screen.getByAltText('Provider');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', providerPoster);
    expect(jest.getTimerCount()).toBe(1);
    jest.runOnlyPendingTimers();
    fireEvent.error(img);
    expect(jest.getTimerCount()).toBe(0);
  });
});

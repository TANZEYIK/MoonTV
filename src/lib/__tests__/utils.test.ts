import { getDoubanImageProxyUrl, processImageUrl } from '@/lib/utils';

const poster =
  'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2933326871.jpg';

describe('Douban poster loading', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.assign(window, { RUNTIME_CONFIG: {} });
  });

  it.each(['img', 'img1', 'img2', 'img3', 'img9'])(
    'uses the same-origin proxy for %s.doubanio.com',
    (host) => {
      const url = poster.replace('img2', host);
      expect(getDoubanImageProxyUrl(url)).toBe(
        `/api/image-proxy?url=${encodeURIComponent(url)}`
      );
    }
  );

  it('encodes the full poster URL including its query string', () => {
    const url = `${poster}?size=large&format=jpg`;
    expect(getDoubanImageProxyUrl(url)).toBe(
      `/api/image-proxy?url=${encodeURIComponent(url)}`
    );
  });

  it.each([
    '',
    '/logo.png',
    'https://video-provider.example/poster.jpg',
    'https://img2.doubanio.com.example/poster.jpg',
    'https://example.com/poster.jpg?host=img2.doubanio.com',
  ])('leaves other images unchanged: %s', (url) => {
    expect(processImageUrl(url)).toBe(url);
    expect(getDoubanImageProxyUrl(url)).toBeNull();
  });

  it('preserves the configured image proxy', () => {
    localStorage.setItem('doubanImageProxyType', 'custom');
    localStorage.setItem('doubanImageProxyUrl', 'https://proxy.example/?url=');
    expect(processImageUrl(poster)).toBe(
      `https://proxy.example/?url=${encodeURIComponent(poster)}`
    );
  });

  it('preserves the server image proxy setting', () => {
    Object.assign(window, {
      RUNTIME_CONFIG: {
        DOUBAN_IMAGE_PROXY_TYPE: 'custom',
        DOUBAN_IMAGE_PROXY: 'https://proxy.example/?url=',
      },
    });
    expect(processImageUrl(poster)).toBe(
      `https://proxy.example/?url=${encodeURIComponent(poster)}`
    );
  });

  it('preserves direct loading before the card needs a fallback', () => {
    expect(processImageUrl(poster)).toBe(poster);
  });

  it('preserves the explicit server proxy setting', () => {
    localStorage.setItem('doubanImageProxyType', 'server');
    expect(processImageUrl(poster)).toBe(
      `/api/image-proxy?url=${encodeURIComponent(poster)}`
    );
  });

  it('preserves the selected CDN', () => {
    localStorage.setItem('doubanImageProxyType', 'cmliussss-cdn-tencent');
    expect(processImageUrl(poster)).toBe(
      poster.replace('img2.doubanio.com', 'img.doubanio.cmliussss.net')
    );
  });
});

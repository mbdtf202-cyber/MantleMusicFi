const axios = require('axios');
const NodeCache = require('node-cache');

// 缓存配置 - 5分钟缓存
const cache = new NodeCache({ stdTTL: 300 });

class DataIntegrationService {
  constructor() {
    this.spotifyToken = null;
    this.spotifyTokenExpiry = null;
  }

  // 获取 Spotify Access Token
  async getSpotifyToken() {
    if (this.spotifyToken && this.spotifyTokenExpiry > Date.now()) {
      return this.spotifyToken;
    }

    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.warn('Spotify credentials not configured, using mock data');
        return null;
      }

      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.spotifyToken = response.data.access_token;
      this.spotifyTokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.spotifyToken;
    } catch (error) {
      console.error('Failed to get Spotify token:', error.message);
      return null;
    }
  }

  // 获取热门音乐数据
  async getTrendingTracks(limit = 50) {
    const cacheKey = `trending_tracks_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const token = await this.getSpotifyToken();
      if (!token) {
        return this.getMockTrendingTracks(limit);
      }

      // 获取多个播放列表的热门歌曲
      const playlists = [
        '37i9dQZEVXbMDoHDwVN2tF', // Global Top 50
        '37i9dQZEVXbLRQDuF5jeBp', // Top 50 USA
        '37i9dQZEVXbJiZcmkrIHGU', // Top 50 Germany
      ];

      const tracks = [];
      
      for (const playlistId of playlists) {
        const response = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { limit: Math.ceil(limit / playlists.length) }
          }
        );

        const playlistTracks = response.data.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0].name,
          album: item.track.album.name,
          popularity: item.track.popularity,
          duration_ms: item.track.duration_ms,
          preview_url: item.track.preview_url,
          external_urls: item.track.external_urls,
          image: item.track.album.images[0]?.url,
          // 模拟投资数据
          currentPrice: Math.random() * 100 + 10,
          marketCap: Math.random() * 1000000 + 100000,
          volume24h: Math.random() * 50000 + 5000,
          priceChange24h: (Math.random() - 0.5) * 20
        }));

        tracks.push(...playlistTracks);
      }

      const result = tracks.slice(0, limit);
      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Failed to fetch trending tracks:', error.message);
      return this.getMockTrendingTracks(limit);
    }
  }

  // 获取加密货币价格数据
  async getCryptoPrices(symbols = ['bitcoin', 'ethereum', 'mantle']) {
    const cacheKey = `crypto_prices_${symbols.join('_')}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: symbols.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        }
      });

      const result = response.data;
      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Failed to fetch crypto prices:', error.message);
      return this.getMockCryptoPrices(symbols);
    }
  }

  // 获取 DeFi 协议数据
  async getDeFiData() {
    const cacheKey = 'defi_data';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // 使用 DeFiLlama API 获取 TVL 数据
      const response = await axios.get('https://api.llama.fi/protocols');
      
      const topProtocols = response.data
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 20)
        .map(protocol => ({
          name: protocol.name,
          tvl: protocol.tvl,
          change_1d: protocol.change_1d,
          change_7d: protocol.change_7d,
          category: protocol.category,
          chains: protocol.chains
        }));

      cache.set(cacheKey, topProtocols);
      return topProtocols;

    } catch (error) {
      console.error('Failed to fetch DeFi data:', error.message);
      return this.getMockDeFiData();
    }
  }

  // Mock 数据方法
  getMockTrendingTracks(limit) {
    const mockTracks = [];
    const artists = ['Taylor Swift', 'Drake', 'Bad Bunny', 'The Weeknd', 'Ariana Grande'];
    const genres = ['Pop', 'Hip-Hop', 'R&B', 'Electronic', 'Rock'];

    for (let i = 0; i < limit; i++) {
      mockTracks.push({
        id: `mock_track_${i}`,
        name: `Track ${i + 1}`,
        artist: artists[i % artists.length],
        album: `Album ${i + 1}`,
        popularity: Math.floor(Math.random() * 100),
        duration_ms: Math.floor(Math.random() * 240000) + 120000,
        genre: genres[i % genres.length],
        currentPrice: Math.random() * 100 + 10,
        marketCap: Math.random() * 1000000 + 100000,
        volume24h: Math.random() * 50000 + 5000,
        priceChange24h: (Math.random() - 0.5) * 20
      });
    }

    return mockTracks;
  }

  getMockCryptoPrices(symbols) {
    const prices = {};
    symbols.forEach(symbol => {
      prices[symbol] = {
        usd: Math.random() * 50000 + 1000,
        usd_24h_change: (Math.random() - 0.5) * 20,
        usd_market_cap: Math.random() * 1000000000 + 100000000,
        usd_24h_vol: Math.random() * 10000000 + 1000000
      };
    });
    return prices;
  }

  getMockDeFiData() {
    return [
      { name: 'Uniswap', tvl: 5000000000, change_1d: 2.5, change_7d: -1.2, category: 'Dexes' },
      { name: 'Aave', tvl: 8000000000, change_1d: 1.8, change_7d: 3.4, category: 'Lending' },
      { name: 'Compound', tvl: 3000000000, change_1d: -0.5, change_7d: 2.1, category: 'Lending' }
    ];
  }

  // 获取实时市场数据
  async getMarketData() {
    try {
      const [tracks, cryptoPrices, defiData] = await Promise.all([
        this.getTrendingTracks(20),
        this.getCryptoPrices(),
        this.getDeFiData()
      ]);

      return {
        trendingTracks: tracks,
        cryptoPrices,
        defiProtocols: defiData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error.message);
      throw error;
    }
  }
}

module.exports = new DataIntegrationService();
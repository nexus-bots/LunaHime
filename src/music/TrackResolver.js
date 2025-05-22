const play = require('play-dl');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../config');

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

// Refresh Spotify token periodically
async function refreshSpotifyToken(retryCount = 0) {
    const maxRetries = 5;
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);
        console.log('Spotify token refreshed');

        // Token expires in 1 hour, refresh after 50 minutes
        setTimeout(refreshSpotifyToken, 50 * 60 * 1000);
    } catch (error) {
        console.error(`Error refreshing Spotify token (attempt ${retryCount + 1}/${maxRetries}):`, error.message);

        // Implement exponential backoff for retries
        const retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 60000); // Max 1 minute

        if (retryCount < maxRetries) {
            console.log(`Retrying Spotify token refresh in ${retryDelay / 1000} seconds...`);
            setTimeout(() => refreshSpotifyToken(retryCount + 1), retryDelay);
        } else {
            console.error('Maximum retry attempts reached for Spotify token refresh. Will try again in 2 minutes.');
            setTimeout(() => refreshSpotifyToken(0), 120000); // 2 minutes
        }
    }
}

// Call once at startup
refreshSpotifyToken();

class TrackResolver {
    /**
     * Resolve a track from a URL or search query
     * @param {string} query - URL or search query
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolve(query) {
        // Check if the query is a URL
        if (this.isUrl(query)) {
            return this.resolveUrl(query);
        }

        // If not a URL, search on YouTube
        return this.search(query);
    }

    /**
     * Check if a string is a URL
     * @param {string} string - String to check
     * @returns {boolean} - Whether the string is a URL
     */
    isUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Resolve a track from a URL
     * @param {string} url - URL to resolve
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolveUrl(url) {
        // Check the URL type
        if (play.yt_validate(url) !== false) {
            return this.resolveYouTube(url);
        } else if (url.includes('spotify.com')) {
            return this.resolveSpotify(url);
        } else if (url.includes('soundcloud.com')) {
            return this.resolveSoundCloud(url);
        } else if (url.includes('deezer.com')) {
            return this.resolveDeezer(url);
        } else {
            throw new Error('Unsupported URL.');
        }
    }

    /**
     * Resolve a YouTube URL
     * @param {string} url - YouTube URL
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolveYouTube(url) {
        try {
            const urlType = play.yt_validate(url);

            if (urlType === 'video') {
                // Single video
                const info = await play.video_info(url);
                const video = info.video_details;

                return [{
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0].url,
                    author: video.channel.name,
                    source: 'youtube'
                }];
            } else if (urlType === 'playlist') {
                // Playlist
                const playlist = await play.playlist_info(url, { incomplete: true });
                const videos = await playlist.all_videos();

                return videos.map(video => ({
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0].url,
                    author: video.channel.name,
                    source: 'youtube'
                }));
            }
        } catch (error) {
            console.error('Error resolving YouTube URL:', error);
            throw new Error(`Error resolving YouTube URL: ${error.message}`);
        }
    }

    /**
     * Resolve a Spotify URL
     * @param {string} url - Spotify URL
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolveSpotify(url) {
        try {
            const urlType = play.sp_validate(url);

            if (!urlType) {
                throw new Error('Invalid Spotify URL.');
            }

            if (urlType === 'track') {
                // Single track
                const trackId = url.split('/').pop().split('?')[0];
                const track = await this.spotifyApiCallWithRetry(() => spotifyApi.getTrack(trackId));

                return [{
                    title: track.body.name,
                    url: track.body.external_urls.spotify,
                    duration: this.formatDuration(track.body.duration_ms),
                    thumbnail: track.body.album.images[0].url,
                    author: track.body.artists.map(artist => artist.name).join(', '),
                    source: 'spotify'
                }];
            } else if (urlType === 'playlist' || urlType === 'album') {
                // Playlist or album
                const id = url.split('/').pop().split('?')[0];
                let tracks = [];

                if (urlType === 'playlist') {
                    const playlist = await this.spotifyApiCallWithRetry(() => spotifyApi.getPlaylist(id));
                    const playlistTracks = await this.spotifyApiCallWithRetry(() => spotifyApi.getPlaylistTracks(id));

                    tracks = playlistTracks.body.items.map(item => {
                        // Skip null tracks (can happen with deleted tracks in playlists)
                        if (!item.track) return null;

                        return {
                            title: item.track.name,
                            url: item.track.external_urls.spotify,
                            duration: this.formatDuration(item.track.duration_ms),
                            thumbnail: item.track.album.images[0]?.url || '',
                            author: item.track.artists.map(artist => artist.name).join(', '),
                            source: 'spotify'
                        };
                    }).filter(track => track !== null); // Remove null tracks
                } else {
                    const album = await this.spotifyApiCallWithRetry(() => spotifyApi.getAlbum(id));

                    tracks = album.body.tracks.items.map(track => ({
                        title: track.name,
                        url: track.external_urls.spotify,
                        duration: this.formatDuration(track.duration_ms),
                        thumbnail: album.body.images[0]?.url || '',
                        author: track.artists.map(artist => artist.name).join(', '),
                        source: 'spotify'
                    }));
                }

                return tracks;
            }
        } catch (error) {
            console.error('Error resolving Spotify URL:', error);

            // Check if token expired and try to refresh
            if (error.message.includes('unauthorized') || error.message.includes('expired')) {
                try {
                    console.log('Token may have expired, attempting to refresh...');
                    await refreshSpotifyToken(0);

                    // Try the request again after token refresh
                    console.log('Retrying Spotify URL resolution after token refresh');
                    return this.resolveSpotify(url);
                } catch (refreshError) {
                    console.error('Failed to refresh token and retry:', refreshError);
                    throw new Error(`Error resolving Spotify URL: ${error.message}`);
                }
            }

            throw new Error(`Error resolving Spotify URL: ${error.message}`);
        }
    }

    /**
     * Make a Spotify API call with retry logic
     * @param {Function} apiCall - Function that returns a promise for the API call
     * @returns {Promise<Object>} - API response
     */
    async spotifyApiCallWithRetry(apiCall, retryCount = 0) {
        const maxRetries = 3;
        try {
            return await apiCall();
        } catch (error) {
            console.error(`Spotify API call failed (attempt ${retryCount + 1}/${maxRetries}):`, error.message);

            // Check if we should retry
            if (retryCount < maxRetries &&
                (error.message.includes('network') ||
                 error.message.includes('timeout') ||
                 error.message.includes('connection') ||
                 error.statusCode === 429 || // Rate limit
                 error.statusCode === 500 || // Server error
                 error.statusCode === 502 || // Bad gateway
                 error.statusCode === 503 || // Service unavailable
                 error.statusCode === 504)) { // Gateway timeout

                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying Spotify API call in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                return this.spotifyApiCallWithRetry(apiCall, retryCount + 1);
            }

            // Check if token expired
            if (error.statusCode === 401) {
                console.log('Token expired, refreshing...');
                await refreshSpotifyToken(0);

                // Retry with fresh token
                return this.spotifyApiCallWithRetry(apiCall, retryCount);
            }

            // If we've exhausted retries or it's not a retryable error
            throw error;
        }
    }

    /**
     * Resolve a SoundCloud URL
     * @param {string} url - SoundCloud URL
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolveSoundCloud(url) {
        try {
            // Use retry logic for SoundCloud API calls
            const soundcloud = await this.getApiCallWithRetry(() => play.soundcloud(url), 'SoundCloud');

            if (soundcloud.type === 'track') {
                // Single track
                return [{
                    title: soundcloud.name,
                    url: soundcloud.url,
                    duration: soundcloud.durationRaw,
                    thumbnail: soundcloud.thumbnail,
                    author: soundcloud.user.name,
                    source: 'soundcloud'
                }];
            } else if (soundcloud.type === 'playlist') {
                // Playlist
                return soundcloud.tracks.map(track => ({
                    title: track.name,
                    url: track.url,
                    duration: track.durationRaw,
                    thumbnail: track.thumbnail,
                    author: track.user.name,
                    source: 'soundcloud'
                }));
            }
        } catch (error) {
            console.error('Error resolving SoundCloud URL:', error);

            // If it's a network error, provide a more helpful message
            if (error.message.includes('network') ||
                error.message.includes('TLS') ||
                error.message.includes('timeout') ||
                error.message.includes('connection')) {
                throw new Error(`Network error while accessing SoundCloud. Please check your internet connection and try again.`);
            }

            throw new Error(`Error resolving SoundCloud URL: ${error.message}`);
        }
    }

    /**
     * Generic API call with retry logic
     * @param {Function} apiCall - Function that returns a promise for the API call
     * @param {string} source - Source name for logging
     * @returns {Promise<Object>} - API response
     */
    async getApiCallWithRetry(apiCall, source, retryCount = 0) {
        const maxRetries = 3;
        try {
            return await apiCall();
        } catch (error) {
            console.error(`${source} API call failed (attempt ${retryCount + 1}/${maxRetries}):`, error.message);

            // Check if we should retry
            if (retryCount < maxRetries &&
                (error.message.includes('network') ||
                 error.message.includes('timeout') ||
                 error.message.includes('TLS') ||
                 error.message.includes('connection'))) {

                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying ${source} API call in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                return this.getApiCallWithRetry(apiCall, source, retryCount + 1);
            }

            // If we've exhausted retries or it's not a retryable error
            throw error;
        }
    }

    /**
     * Resolve a Deezer URL
     * @param {string} url - Deezer URL
     * @returns {Promise<Array>} - Array of track objects
     */
    async resolveDeezer(url) {
        try {
            // For Deezer, we'll extract the ID and type from the URL
            // and then search for it on YouTube
            const urlParts = url.split('/');
            const type = urlParts[urlParts.length - 2];
            const id = urlParts[urlParts.length - 1];

            // Fetch from Deezer API
            let apiUrl;
            if (type === 'track') {
                apiUrl = `https://api.deezer.com/track/${id}`;
            } else if (type === 'album') {
                apiUrl = `https://api.deezer.com/album/${id}`;
            } else if (type === 'playlist') {
                apiUrl = `https://api.deezer.com/playlist/${id}`;
            } else {
                throw new Error('Unsupported Deezer URL type.');
            }

            // Use retry logic for fetch calls
            const fetchWithRetry = async (url) => {
                return this.getApiCallWithRetry(async () => {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    return data;
                }, 'Deezer');
            };

            const data = await fetchWithRetry(apiUrl);

            if (type === 'track') {
                // Single track
                return [{
                    title: data.title,
                    url: data.link,
                    duration: this.formatDuration(data.duration * 1000),
                    thumbnail: data.album.cover_xl,
                    author: data.artist.name,
                    source: 'deezer'
                }];
            } else {
                // Album or playlist
                let tracks = [];

                if (type === 'album') {
                    const tracksData = await fetchWithRetry(`https://api.deezer.com/album/${id}/tracks`);

                    tracks = tracksData.data.map(track => ({
                        title: track.title,
                        url: track.link,
                        duration: this.formatDuration(track.duration * 1000),
                        thumbnail: data.cover_xl,
                        author: track.artist.name,
                        source: 'deezer'
                    }));
                } else {
                    const tracksData = await fetchWithRetry(`https://api.deezer.com/playlist/${id}/tracks`);

                    tracks = tracksData.data.map(track => ({
                        title: track.title,
                        url: track.link,
                        duration: this.formatDuration(track.duration * 1000),
                        thumbnail: track.album?.cover_xl || '',
                        author: track.artist.name,
                        source: 'deezer'
                    }));
                }

                return tracks;
            }
        } catch (error) {
            console.error('Error resolving Deezer URL:', error);

            // If it's a network error, provide a more helpful message
            if (error.message.includes('network') ||
                error.message.includes('TLS') ||
                error.message.includes('timeout') ||
                error.message.includes('connection')) {
                throw new Error(`Network error while accessing Deezer. Please check your internet connection and try again.`);
            }

            throw new Error(`Error resolving Deezer URL: ${error.message}`);
        }
    }

    /**
     * Search for tracks on YouTube
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Array of track objects
     */
    async search(query) {
        try {
            // Use the retry helper for search
            const results = await this.getSearchWithRetry(() => play.search(query, { limit: 1 }), 'YouTube Search');

            if (results.length === 0) {
                throw new Error('No results found.');
            }

            const video = results[0];

            return [{
                title: video.title,
                url: video.url,
                duration: video.durationRaw,
                thumbnail: video.thumbnails[0].url,
                author: video.channel.name,
                source: 'youtube'
            }];
        } catch (error) {
            console.error('Error searching for tracks:', error);

            // If it's a network error, provide a more helpful message
            if (error.message.includes('network') ||
                error.message.includes('TLS') ||
                error.message.includes('timeout') ||
                error.message.includes('connection')) {
                throw new Error(`Network error while searching. Please check your internet connection and try again.`);
            }

            throw new Error(`Error searching for tracks: ${error.message}`);
        }
    }

    /**
     * Format duration from milliseconds to MM:SS
     * @param {number} ms - Duration in milliseconds
     * @returns {string} - Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

module.exports = new TrackResolver();

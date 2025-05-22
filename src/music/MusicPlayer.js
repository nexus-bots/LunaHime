const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const { Collection } = require('discord.js');
const play = require('play-dl');
const { errorEmbed, musicEmbed } = require('../utils/embeds');

class MusicPlayer {
    constructor() {
        this.queues = new Collection();
        this.votes = new Collection();
    }

    /**
     * Get or create a server queue
     * @param {string} guildId - Discord guild ID
     * @returns {Object} - Server queue
     */
    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, {
                textChannel: null,
                voiceChannel: null,
                connection: null,
                player: null,
                songs: [],
                volume: 100,
                playing: false,
                loopMode: 'off', // 'off', 'track', 'queue'
                previousSongs: []
            });
        }
        return this.queues.get(guildId);
    }

    /**
     * Join a voice channel
     * @param {Object} interaction - Discord interaction or message
     * @param {Object} voiceChannel - Voice channel to join
     * @returns {Promise<Object>} - Voice connection
     */
    async join(interaction, voiceChannel) {
        const queue = this.getQueue(interaction.guild.id);

        // If already in a voice channel, check if it's the same one
        if (queue.connection && queue.voiceChannel.id !== voiceChannel.id) {
            return { success: false, message: `I'm already in <#${queue.voiceChannel.id}>. Use the force option to move me.` };
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // Set up connection event handlers
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
                } catch {
                    this.leave(interaction.guild.id);
                }
            });

            // Create audio player if it doesn't exist
            if (!queue.player) {
                const player = createAudioPlayer();

                player.on(AudioPlayerStatus.Idle, () => {
                    // Save the current song to previous songs
                    if (queue.songs[0]) {
                        queue.previousSongs.push(queue.songs[0]);
                        // Keep only the last 10 previous songs
                        if (queue.previousSongs.length > 10) {
                            queue.previousSongs.shift();
                        }
                    }

                    // Handle loop mode
                    if (queue.loopMode === 'track' && queue.songs[0]) {
                        // Do nothing, keep the current song
                    } else if (queue.loopMode === 'queue' && queue.songs.length > 0) {
                        // Move the current song to the end of the queue
                        const currentSong = queue.songs.shift();
                        queue.songs.push(currentSong);
                    } else {
                        // Remove the current song
                        queue.songs.shift();
                    }

                    // Play the next song if there are any
                    if (queue.songs.length > 0) {
                        this.play(interaction.guild.id);
                    } else {
                        // No more songs, clear the queue
                        queue.playing = false;
                        // Don't disconnect immediately, wait for a while
                        setTimeout(() => {
                            if (!queue.playing && queue.connection) {
                                this.leave(interaction.guild.id);
                            }
                        }, 300000); // 5 minutes
                    }
                });

                player.on('error', (error) => {
                    console.error(`Player error: ${error.message}`);
                    queue.textChannel.send({ embeds: [errorEmbed('Error', `An error occurred while playing music: ${error.message}`)] });
                    queue.songs.shift();
                    if (queue.songs.length > 0) {
                        this.play(interaction.guild.id);
                    } else {
                        this.leave(interaction.guild.id);
                    }
                });

                queue.player = player;
            }

            // Subscribe the connection to the player
            connection.subscribe(queue.player);

            // Update queue
            queue.connection = connection;
            queue.voiceChannel = voiceChannel;

            return { success: true };
        } catch (error) {
            console.error(`Error joining voice channel: ${error.message}`);
            return { success: false, message: `Error joining voice channel: ${error.message}` };
        }
    }

    /**
     * Leave a voice channel
     * @param {string} guildId - Discord guild ID
     */
    leave(guildId) {
        const queue = this.queues.get(guildId);
        if (queue) {
            if (queue.player) {
                queue.player.stop();
            }
            if (queue.connection) {
                queue.connection.destroy();
            }
            this.queues.delete(guildId);
        }
    }

    /**
     * Play a song
     * @param {string} guildId - Discord guild ID
     * @param {number} retryCount - Number of retries attempted (default: 0)
     */
    async play(guildId, retryCount = 0) {
        const queue = this.getQueue(guildId);

        if (!queue.songs.length) {
            return;
        }

        const song = queue.songs[0];
        const maxRetries = 3; // Maximum number of retries

        try {
            let stream;

            // Get stream based on song source
            if (song.source === 'youtube') {
                stream = await this.getStreamWithRetry(() => play.stream(song.url), 'YouTube');
            } else if (song.source === 'spotify') {
                // For Spotify, search the song on YouTube and play it
                const ytSearch = await this.getSearchWithRetry(() => play.search(`${song.title} ${song.author}`, { limit: 1 }), 'Spotify');
                if (ytSearch.length === 0) {
                    throw new Error('Could not find a YouTube video for this Spotify track.');
                }
                stream = await this.getStreamWithRetry(() => play.stream(ytSearch[0].url), 'Spotify via YouTube');
            } else if (song.source === 'soundcloud') {
                stream = await this.getStreamWithRetry(() => play.stream(song.url), 'SoundCloud');
            } else {
                throw new Error('Unsupported source.');
            }

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });

            // Set volume
            resource.volume.setVolume(queue.volume / 100);

            // Play the song
            queue.player.play(resource);
            queue.playing = true;

            // Send now playing message
            const embed = musicEmbed(song, queue.songs);
            queue.textChannel.send({ embeds: [embed] });

            // Clear votes for this song
            this.votes.delete(guildId);

            return { success: true };
        } catch (error) {
            console.error(`Error playing song: ${error.message}`);

            // Check if we should retry
            if (retryCount < maxRetries &&
                (error.message.includes('network') ||
                 error.message.includes('TLS') ||
                 error.message.includes('timeout') ||
                 error.message.includes('connection'))) {

                // Exponential backoff: wait longer between each retry
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying playback (attempt ${retryCount + 1}/${maxRetries}) in ${delay}ms...`);

                // Notify users about the retry
                if (retryCount === 0) {
                    queue.textChannel.send({
                        embeds: [errorEmbed('Connection Issue',
                            `Having trouble connecting to music services. Retrying...`)]
                    });
                }

                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.play(guildId, retryCount + 1);
            }

            // If we've exhausted retries or it's not a network error, skip to next song
            queue.textChannel.send({
                embeds: [errorEmbed('Error', `An error occurred while playing music: ${error.message}`)]
            });
            queue.songs.shift();
            if (queue.songs.length > 0) {
                this.play(guildId);
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * Get stream with retry logic
     * @param {Function} streamFunc - Function that returns a promise for the stream
     * @param {string} source - Source name for logging
     * @returns {Promise<Object>} - Stream object
     */
    async getStreamWithRetry(streamFunc, source) {
        const maxAttempts = 3;
        let lastError;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await streamFunc();
            } catch (error) {
                console.error(`Attempt ${attempt + 1}/${maxAttempts} failed to get stream from ${source}: ${error.message}`);
                lastError = error;

                // Only retry on network errors
                if (!error.message.includes('network') &&
                    !error.message.includes('TLS') &&
                    !error.message.includes('timeout') &&
                    !error.message.includes('connection')) {
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < maxAttempts - 1) {
                    const delay = Math.pow(2, attempt) * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Get search results with retry logic
     * @param {Function} searchFunc - Function that returns a promise for the search results
     * @param {string} source - Source name for logging
     * @returns {Promise<Array>} - Search results
     */
    async getSearchWithRetry(searchFunc, source) {
        const maxAttempts = 3;
        let lastError;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await searchFunc();
            } catch (error) {
                console.error(`Attempt ${attempt + 1}/${maxAttempts} failed to search from ${source}: ${error.message}`);
                lastError = error;

                // Only retry on network errors
                if (!error.message.includes('network') &&
                    !error.message.includes('TLS') &&
                    !error.message.includes('timeout') &&
                    !error.message.includes('connection')) {
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < maxAttempts - 1) {
                    const delay = Math.pow(2, attempt) * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }
}

module.exports = new MusicPlayer();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const musicPlayer = require('../../music/MusicPlayer');
const trackResolver = require('../../music/TrackResolver');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Plays a song from YouTube, Spotify, SoundCloud, or Deezer',
    
    // Slash command definition
    slash: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube, Spotify, SoundCloud, or Deezer')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Song URL or search query')
                .setRequired(true))
        .toJSON(),
    
    /**
     * Execute text command
     * @param {Object} message - Discord.js Message
     * @param {Array} args - Command arguments
     * @param {Object} client - Discord.js Client
     */
    async execute(message, args, client) {
        // Check if user is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to play music!')] });
        }
        
        // Check if there's a query
        if (!args.length) {
            return message.reply({ embeds: [errorEmbed('Error', 'Please provide a song URL or search query!')] });
        }
        
        // Get the query
        const query = args.join(' ');
        
        try {
            // Send loading message
            const loadingMessage = await message.reply({ embeds: [successEmbed('Loading...', 'Searching for your song...')] });
            
            // Resolve the track
            const tracks = await trackResolver.resolve(query);
            
            if (!tracks || tracks.length === 0) {
                return loadingMessage.edit({ embeds: [errorEmbed('Error', 'No tracks found!')] });
            }
            
            // Get or create server queue
            const queue = musicPlayer.getQueue(message.guild.id);
            
            // Set text channel
            queue.textChannel = message.channel;
            
            // Join voice channel if not already connected
            if (!queue.connection) {
                const joinResult = await musicPlayer.join(message, message.member.voice.channel);
                
                if (!joinResult.success) {
                    return loadingMessage.edit({ embeds: [errorEmbed('Error', joinResult.message)] });
                }
            }
            
            // Add tracks to queue
            queue.songs = queue.songs.concat(tracks);
            
            // Create response embed
            let responseEmbed;
            
            if (tracks.length === 1) {
                responseEmbed = successEmbed(
                    '🎵 Added to Queue',
                    `[${tracks[0].title}](${tracks[0].url}) by ${tracks[0].author}`
                )
                .setThumbnail(tracks[0].thumbnail);
            } else {
                responseEmbed = successEmbed(
                    '🎵 Added to Queue',
                    `Added ${tracks.length} songs to the queue`
                );
            }
            
            // Create control buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel('Pause')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('queue')
                        .setLabel('Queue')
                        .setStyle(ButtonStyle.Success)
                );
            
            // Edit loading message
            await loadingMessage.edit({ embeds: [responseEmbed], components: [row] });
            
            // Start playing if not already playing
            if (!queue.playing) {
                await musicPlayer.play(message.guild.id);
            }
        } catch (error) {
            console.error('Error in play command:', error);
            message.reply({ embeds: [errorEmbed('Error', `An error occurred: ${error.message}`)] });
        }
    },
    
    /**
     * Execute slash command
     * @param {Object} interaction - Discord.js Interaction
     * @param {Object} client - Discord.js Client
     */
    async executeSlash(interaction, client) {
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to play music!')], ephemeral: true });
        }
        
        // Get the query
        const query = interaction.options.getString('query');
        
        try {
            // Defer reply
            await interaction.deferReply();
            
            // Resolve the track
            const tracks = await trackResolver.resolve(query);
            
            if (!tracks || tracks.length === 0) {
                return interaction.editReply({ embeds: [errorEmbed('Error', 'No tracks found!')] });
            }
            
            // Get or create server queue
            const queue = musicPlayer.getQueue(interaction.guild.id);
            
            // Set text channel
            queue.textChannel = interaction.channel;
            
            // Join voice channel if not already connected
            if (!queue.connection) {
                const joinResult = await musicPlayer.join(interaction, interaction.member.voice.channel);
                
                if (!joinResult.success) {
                    return interaction.editReply({ embeds: [errorEmbed('Error', joinResult.message)] });
                }
            }
            
            // Add tracks to queue
            queue.songs = queue.songs.concat(tracks);
            
            // Create response embed
            let responseEmbed;
            
            if (tracks.length === 1) {
                responseEmbed = successEmbed(
                    '🎵 Added to Queue',
                    `[${tracks[0].title}](${tracks[0].url}) by ${tracks[0].author}`
                )
                .setThumbnail(tracks[0].thumbnail);
            } else {
                responseEmbed = successEmbed(
                    '🎵 Added to Queue',
                    `Added ${tracks.length} songs to the queue`
                );
            }
            
            // Create control buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel('Pause')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('queue')
                        .setLabel('Queue')
                        .setStyle(ButtonStyle.Success)
                );
            
            // Edit reply
            await interaction.editReply({ embeds: [responseEmbed], components: [row] });
            
            // Start playing if not already playing
            if (!queue.playing) {
                await musicPlayer.play(interaction.guild.id);
            }
        } catch (error) {
            console.error('Error in play command:', error);
            
            if (interaction.deferred) {
                interaction.editReply({ embeds: [errorEmbed('Error', `An error occurred: ${error.message}`)] });
            } else {
                interaction.reply({ embeds: [errorEmbed('Error', `An error occurred: ${error.message}`)], ephemeral: true });
            }
        }
    }
};

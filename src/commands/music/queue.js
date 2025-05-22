const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const musicPlayer = require('../../music/MusicPlayer');
const { createEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Shows the current music queue',
    
    // Slash command definition
    slash: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows the current music queue')
        .addIntegerOption(option => 
            option.setName('page')
                .setDescription('Page number')
                .setRequired(false))
        .toJSON(),
    
    /**
     * Execute text command
     * @param {Object} message - Discord.js Message
     * @param {Array} args - Command arguments
     * @param {Object} client - Discord.js Client
     */
    async execute(message, args, client) {
        // Get server queue
        const queue = musicPlayer.getQueue(message.guild.id);
        
        // Check if there's a queue
        if (!queue || !queue.songs.length) {
            return message.reply({ embeds: [errorEmbed('Error', 'There is nothing playing!')] });
        }
        
        // Get page number
        const page = parseInt(args[0]) || 1;
        
        // Generate queue embed
        const queueEmbed = this.generateQueueEmbed(queue, page);
        
        // Create pagination buttons
        const row = this.createPaginationButtons(page, Math.ceil(queue.songs.length / 10));
        
        // Send queue message
        message.reply({ embeds: [queueEmbed], components: row ? [row] : [] });
    },
    
    /**
     * Execute slash command
     * @param {Object} interaction - Discord.js Interaction
     * @param {Object} client - Discord.js Client
     */
    async executeSlash(interaction, client) {
        // Get server queue
        const queue = musicPlayer.getQueue(interaction.guild.id);
        
        // Check if there's a queue
        if (!queue || !queue.songs.length) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'There is nothing playing!')], ephemeral: true });
        }
        
        // Get page number
        const page = interaction.options.getInteger('page') || 1;
        
        // Generate queue embed
        const queueEmbed = this.generateQueueEmbed(queue, page);
        
        // Create pagination buttons
        const row = this.createPaginationButtons(page, Math.ceil(queue.songs.length / 10));
        
        // Send queue message
        interaction.reply({ embeds: [queueEmbed], components: row ? [row] : [] });
    },
    
    /**
     * Generate queue embed
     * @param {Object} queue - Server queue
     * @param {number} page - Page number
     * @returns {Object} - Discord.js embed
     */
    generateQueueEmbed(queue, page) {
        // Calculate total pages
        const totalPages = Math.ceil(queue.songs.length / 10);
        
        // Validate page number
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        
        // Calculate start and end indices
        const start = (page - 1) * 10;
        const end = start + 10;
        
        // Get current song
        const currentSong = queue.songs[0];
        
        // Calculate total duration
        const totalDuration = queue.songs.reduce((acc, song) => {
            // Convert duration to seconds
            const parts = song.duration.split(':');
            let seconds = 0;
            
            if (parts.length === 3) {
                seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            } else if (parts.length === 2) {
                seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
            
            return acc + seconds;
        }, 0);
        
        // Format total duration
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        const seconds = totalDuration % 60;
        
        let formattedTotalDuration;
        
        if (hours > 0) {
            formattedTotalDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            formattedTotalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Create embed
        const embed = createEmbed({
            title: '🎵 Music Queue',
            description: `**Now Playing:**\n[${currentSong.title}](${currentSong.url}) by ${currentSong.author} | \`${currentSong.duration}\`\n\n**Up Next:**\n${
                queue.songs.length > 1
                    ? queue.songs
                          .slice(1)
                          .slice(start, end)
                          .map((song, index) => `**${start + index + 1}.** [${song.title}](${song.url}) | \`${song.duration}\``)
                          .join('\n')
                    : 'No songs in queue'
            }`,
            fields: [
                {
                    name: 'Queue Info',
                    value: `**${queue.songs.length}** songs | **${formattedTotalDuration}** total duration | Page **${page}/${totalPages}**`
                }
            ],
            thumbnail: currentSong.thumbnail,
            timestamp: true
        });
        
        return embed;
    },
    
    /**
     * Create pagination buttons
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     * @returns {Object} - Discord.js action row
     */
    createPaginationButtons(currentPage, totalPages) {
        // If there's only one page, don't create buttons
        if (totalPages <= 1) {
            return null;
        }
        
        // Create action row
        const row = new ActionRowBuilder();
        
        // Add first page button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('queue_first')
                .setLabel('<<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1)
        );
        
        // Add previous page button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('queue_prev')
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1)
        );
        
        // Add page indicator
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('queue_page')
                .setLabel(`${currentPage}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );
        
        // Add next page button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('queue_next')
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
        );
        
        // Add last page button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('queue_last')
                .setLabel('>>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
        );
        
        return row;
    }
};

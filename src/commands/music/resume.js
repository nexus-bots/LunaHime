const { SlashCommandBuilder } = require('@discordjs/builders');
const musicPlayer = require('../../music/MusicPlayer');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isDJ } = require('../../utils/permissions');

module.exports = {
    name: 'resume',
    aliases: ['r', 'res'],
    description: 'Resumes the currently paused music',
    
    // Slash command definition
    slash: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the currently paused music')
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
            return message.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to resume music!')] });
        }
        
        // Check if user has DJ permissions
        if (!(await isDJ(message.member))) {
            return message.reply({ embeds: [errorEmbed('Error', 'You need to have DJ permissions to use this command!')] });
        }
        
        // Get server queue
        const queue = musicPlayer.getQueue(message.guild.id);
        
        // Check if there's a queue
        if (!queue || !queue.songs.length) {
            return message.reply({ embeds: [errorEmbed('Error', 'There is nothing playing!')] });
        }
        
        // Check if the bot is in the same voice channel
        if (message.guild.members.me.voice.channel && message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
            return message.reply({ embeds: [errorEmbed('Error', 'You need to be in the same voice channel as the bot!')] });
        }
        
        // Resume the player
        queue.player.unpause();
        
        // Send success message
        message.reply({ embeds: [successEmbed('Resumed', 'Music has been resumed!')] });
    },
    
    /**
     * Execute slash command
     * @param {Object} interaction - Discord.js Interaction
     * @param {Object} client - Discord.js Client
     */
    async executeSlash(interaction, client) {
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to resume music!')], ephemeral: true });
        }
        
        // Check if user has DJ permissions
        if (!(await isDJ(interaction.member))) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You need to have DJ permissions to use this command!')], ephemeral: true });
        }
        
        // Get server queue
        const queue = musicPlayer.getQueue(interaction.guild.id);
        
        // Check if there's a queue
        if (!queue || !queue.songs.length) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'There is nothing playing!')], ephemeral: true });
        }
        
        // Check if the bot is in the same voice channel
        if (interaction.guild.members.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
            return interaction.reply({ embeds: [errorEmbed('Error', 'You need to be in the same voice channel as the bot!')], ephemeral: true });
        }
        
        // Resume the player
        queue.player.unpause();
        
        // Send success message
        interaction.reply({ embeds: [successEmbed('Resumed', 'Music has been resumed!')] });
    }
};

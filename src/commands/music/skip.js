const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection } = require('discord.js');
const musicPlayer = require('../../music/MusicPlayer');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const { isDJ, requiresVote } = require('../../utils/permissions');

module.exports = {
    name: 'skip',
    aliases: ['s', 'n', 'next'],
    description: 'Skips the currently playing song',
    
    // Slash command definition
    slash: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the currently playing song')
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
            return message.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to skip music!')] });
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
        
        // Check if user has DJ permissions
        const hasDJPermissions = await isDJ(message.member);
        
        // Check if a vote is required
        if (!hasDJPermissions && requiresVote(message.member.voice.channel)) {
            // Get or create votes collection
            if (!musicPlayer.votes.has(message.guild.id)) {
                musicPlayer.votes.set(message.guild.id, new Collection());
            }
            
            const votes = musicPlayer.votes.get(message.guild.id);
            
            // Check if user has already voted
            if (votes.has(message.author.id)) {
                return message.reply({ embeds: [errorEmbed('Error', 'You have already voted to skip this song!')] });
            }
            
            // Add vote
            votes.set(message.author.id, true);
            
            // Calculate required votes
            const voiceChannel = message.member.voice.channel;
            const members = voiceChannel.members.filter(m => !m.user.bot).size;
            const requiredVotes = Math.ceil(members / 2);
            
            // Check if enough votes
            if (votes.size >= requiredVotes) {
                // Skip the song
                queue.player.stop();
                
                // Send success message
                return message.reply({ embeds: [successEmbed('Skipped', 'Song has been skipped!')] });
            } else {
                // Send vote message
                return message.reply({ embeds: [infoEmbed('Vote to Skip', `Vote added! ${votes.size}/${requiredVotes} votes required to skip.`)] });
            }
        } else {
            // Skip the song
            queue.player.stop();
            
            // Send success message
            message.reply({ embeds: [successEmbed('Skipped', 'Song has been skipped!')] });
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
            return interaction.reply({ embeds: [errorEmbed('Error', 'You need to be in a voice channel to skip music!')], ephemeral: true });
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
        
        // Check if user has DJ permissions
        const hasDJPermissions = await isDJ(interaction.member);
        
        // Check if a vote is required
        if (!hasDJPermissions && requiresVote(interaction.member.voice.channel)) {
            // Get or create votes collection
            if (!musicPlayer.votes.has(interaction.guild.id)) {
                musicPlayer.votes.set(interaction.guild.id, new Collection());
            }
            
            const votes = musicPlayer.votes.get(interaction.guild.id);
            
            // Check if user has already voted
            if (votes.has(interaction.user.id)) {
                return interaction.reply({ embeds: [errorEmbed('Error', 'You have already voted to skip this song!')], ephemeral: true });
            }
            
            // Add vote
            votes.set(interaction.user.id, true);
            
            // Calculate required votes
            const voiceChannel = interaction.member.voice.channel;
            const members = voiceChannel.members.filter(m => !m.user.bot).size;
            const requiredVotes = Math.ceil(members / 2);
            
            // Check if enough votes
            if (votes.size >= requiredVotes) {
                // Skip the song
                queue.player.stop();
                
                // Send success message
                return interaction.reply({ embeds: [successEmbed('Skipped', 'Song has been skipped!')] });
            } else {
                // Send vote message
                return interaction.reply({ embeds: [infoEmbed('Vote to Skip', `Vote added! ${votes.size}/${requiredVotes} votes required to skip.`)] });
            }
        } else {
            // Skip the song
            queue.player.stop();
            
            // Send success message
            interaction.reply({ embeds: [successEmbed('Skipped', 'Song has been skipped!')] });
        }
    }
};

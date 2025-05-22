const { PermissionsBitField } = require('discord.js');
const Guild = require('../database/models/Guild');

/**
 * Check if a user has DJ permissions
 * @param {Object} member - Discord.js GuildMember
 * @param {Object} guild - Guild settings from database
 * @returns {boolean} - Whether the user has DJ permissions
 */
async function isDJ(member) {
    // Fetch guild settings
    const guildSettings = await Guild.findOne({ guildId: member.guild.id });
    
    // If user is an admin, they have DJ permissions
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return true;
    }
    
    // If there's a DJ role set and the user has it, they have DJ permissions
    if (guildSettings && guildSettings.djRole) {
        return member.roles.cache.has(guildSettings.djRole);
    }
    
    // Default to false
    return false;
}

/**
 * Check if a user is an admin
 * @param {Object} member - Discord.js GuildMember
 * @returns {boolean} - Whether the user is an admin
 */
function isAdmin(member) {
    return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

/**
 * Check if a vote is required for an action
 * @param {Object} voiceChannel - Discord.js VoiceChannel
 * @returns {boolean} - Whether a vote is required
 */
function requiresVote(voiceChannel) {
    // If there are more than 3 users in the voice channel, a vote is required
    return voiceChannel.members.filter(m => !m.user.bot).size > 3;
}

module.exports = {
    isDJ,
    isAdmin,
    requiresVote
};

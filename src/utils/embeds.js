const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Create a standard embed with the bot's theme
 * @param {Object} options - Embed options
 * @returns {EmbedBuilder} - Discord.js embed
 */
function createEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || config.colors.primary)
        .setFooter({ text: options.footer || config.embedFooter });
    
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    if (options.fields) embed.addFields(options.fields);
    if (options.timestamp) embed.setTimestamp();
    
    return embed;
}

/**
 * Create a success embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} - Discord.js embed
 */
function successEmbed(title, description) {
    return createEmbed({
        title,
        description,
        color: config.colors.success,
        timestamp: true
    });
}

/**
 * Create an error embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} - Discord.js embed
 */
function errorEmbed(title, description) {
    return createEmbed({
        title,
        description,
        color: config.colors.error,
        timestamp: true
    });
}

/**
 * Create an info embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} - Discord.js embed
 */
function infoEmbed(title, description) {
    return createEmbed({
        title,
        description,
        color: config.colors.info,
        timestamp: true
    });
}

/**
 * Create a music player embed
 * @param {Object} track - Track information
 * @param {Object} queue - Queue information
 * @returns {EmbedBuilder} - Discord.js embed
 */
function musicEmbed(track, queue) {
    return createEmbed({
        title: `🎵 Now Playing: ${track.title}`,
        description: `By: ${track.author}\nDuration: ${track.duration}\n\n${queue ? `Queue: ${queue.length} songs` : ''}`,
        thumbnail: track.thumbnail,
        timestamp: true
    });
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    infoEmbed,
    musicEmbed
};

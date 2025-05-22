const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed, errorEmbed } = require('../../utils/embeds');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Shows all available commands',

    // Slash command definition
    slash: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .toJSON(),

    /**
     * Execute text command
     * @param {Object} message - Discord.js Message
     * @param {Array} args - Command arguments
     * @param {Object} client - Discord.js Client
     */
    async execute(message, args, client) {
        try {
            // Show all commands
            const embed = this.generateHelpEmbed(client);
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing help command:', error);
            try {
                await message.reply('There was an error displaying the help menu. Please try again later.');
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    },

    /**
     * Execute slash command
     * @param {Object} interaction - Discord.js Interaction
     * @param {Object} client - Discord.js Client
     */
    async executeSlash(interaction, client) {
        try {
            // Defer the reply to prevent timeout
            await interaction.deferReply();

            // Generate help embed
            const embed = this.generateHelpEmbed(client);

            // Edit the deferred reply with the help embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing help command:', error);

            // Try to respond with a simplified error message if possible
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'There was an error displaying the help menu. Please try again later.', ephemeral: true });
                } else {
                    await interaction.editReply({ content: 'There was an error displaying the help menu. Please try again later.' });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    },

    /**
     * Generate help embed
     * @param {Object} client - Discord.js Client
     * @returns {Object} - Discord.js embed
     */
    generateHelpEmbed(client) {
        // Create embed
        const embed = createEmbed({
            title: 'LunaHime Music Bot Help',
            description: 'Here are all the available commands:',
            timestamp: true
        });

        // Get commands by category using the client's command collection
        const commandsByCategory = {};

        // Group commands by category
        client.commandHandler.commands.forEach(cmd => {
            // Skip hidden commands if any
            if (cmd.hidden) return;

            // Determine category from command's file path
            let category = 'Other';

            // Try to find the category based on the command's location
            const commandFolders = fs.readdirSync(path.join(__dirname, '../../commands'));
            for (const folder of commandFolders) {
                const commandPath = path.join(__dirname, `../../commands/${folder}/${cmd.name}.js`);
                if (fs.existsSync(commandPath)) {
                    category = folder;
                    break;
                }
            }

            // Initialize category array if it doesn't exist
            if (!commandsByCategory[category]) {
                commandsByCategory[category] = [];
            }

            // Add command to category
            commandsByCategory[category].push(cmd);
        });

        // Add fields for each category
        Object.keys(commandsByCategory).sort().forEach(category => {
            const commands = commandsByCategory[category];
            if (commands.length > 0) {
                embed.addFields({
                    name: `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
                    value: commands.map(cmd => `\`${cmd.name}\` - ${cmd.description}`).join('\n')
                });
            }
        });

        // Add footer
        embed.addFields({
            name: 'Usage',
            value: 'Use `-command` for text commands or `/command` for slash commands.'
        });

        return embed;
    }
};

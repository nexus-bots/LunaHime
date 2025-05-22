const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const Guild = require('../database/models/Guild');

class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.slashCommands = [];
    }

    /**
     * Load all commands
     */
    async loadCommands() {
        const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));
        
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(path.join(__dirname, `../commands/${folder}`))
                .filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                
                // Set command name and aliases
                this.commands.set(command.name, command);
                
                // Add to slash commands array if it has a slash property
                if (command.slash) {
                    this.slashCommands.push(command.slash);
                }
                
                console.log(`Loaded command: ${command.name}`);
            }
        }
    }

    /**
     * Register slash commands with Discord API
     */
    async registerSlashCommands() {
        try {
            const rest = new REST({ version: '10' }).setToken(config.token);
            
            console.log('Started refreshing application (/) commands.');
            
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: this.slashCommands }
            );
            
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }

    /**
     * Handle a message command
     * @param {Object} message - Discord.js Message
     * @param {string} prefix - Command prefix
     */
    async handleMessageCommand(message) {
        // Ignore messages from bots
        if (message.author.bot) return;
        
        // Get guild settings
        const guildSettings = await Guild.findOne({ guildId: message.guild.id }) || 
            await Guild.create({ guildId: message.guild.id });
        
        const prefix = guildSettings.prefix;
        
        // Check if message starts with prefix
        if (!message.content.startsWith(prefix)) return;
        
        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Find command or alias
        const command = this.commands.get(commandName) || 
            this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return;
        
        // Check if command is text-only
        if (command.slashOnly) {
            return message.reply({ content: 'This command can only be used as a slash command.' });
        }
        
        try {
            // Execute command
            await command.execute(message, args, this.client);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            message.reply({ content: 'There was an error executing that command.' });
        }
    }

    /**
     * Handle a slash command
     * @param {Object} interaction - Discord.js Interaction
     */
    async handleSlashCommand(interaction) {
        if (!interaction.isCommand()) return;
        
        const command = this.commands.get(interaction.commandName);
        
        if (!command) return;
        
        try {
            // Execute command
            await command.executeSlash(interaction, this.client);
        } catch (error) {
            console.error(`Error executing slash command ${interaction.commandName}:`, error);
            
            // Reply to the interaction if it hasn't been replied to yet
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error executing that command.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
            }
        }
    }
}

module.exports = CommandHandler;

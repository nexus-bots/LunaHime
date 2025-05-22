require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

console.log('Starting slash command registration...');

// Initialize commands collection
const commands = new Collection();
const slashCommands = [];

// Load all commands
const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(__dirname, `../commands/${folder}`))
        .filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`../commands/${folder}/${file}`);
        
        // Set command name
        commands.set(command.name, command);
        
        // Add to slash commands array if it has a slash property
        if (command.slash) {
            slashCommands.push(command.slash);
            console.log(`Added slash command: ${command.name}`);
        }
    }
}

// Register slash commands with Discord API
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${slashCommands.length} application (/) commands.`);
        
        // Register global commands
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: slashCommands }
        );
        
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();

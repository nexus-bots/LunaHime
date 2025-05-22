const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const database = require('./database');
const CommandHandler = require('./utils/commandHandler');
const Dashboard = require('./dashboard');

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
});

// Initialize command handler
client.commandHandler = new CommandHandler(client);

// Connect to database
database.connect();

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events'))
    .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];

    if (event.once) {
        client.once(eventName, (...args) => event.execute(...args, client));
    } else {
        client.on(eventName, (...args) => event.execute(...args, client));
    }

    console.log(`Loaded event: ${eventName}`);
}

// Login to Discord
client.login(config.token)
    .then(() => {
        console.log('Bot logged in successfully');

        // Initialize and start dashboard
        const dashboard = new Dashboard(client);
        dashboard.start();
    })
    .catch(error => {
        console.error('Error logging in:', error);
    });

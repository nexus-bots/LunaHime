module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);
        
        // Set bot activity
        client.user.setActivity('music | -help', { type: 'LISTENING' });
        
        // Load commands
        await client.commandHandler.loadCommands();
        
        // Register slash commands
        await client.commandHandler.registerSlashCommands();
    }
};

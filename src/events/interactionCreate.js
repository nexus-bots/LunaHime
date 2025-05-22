module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isCommand()) {
            await client.commandHandler.handleSlashCommand(interaction);
        }
    }
};

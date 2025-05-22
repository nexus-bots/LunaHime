module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        // Handle message commands
        await client.commandHandler.handleMessageCommand(message);
    }
};

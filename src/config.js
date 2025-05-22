require('dotenv').config();

module.exports = {
    // Bot Configuration
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    defaultPrefix: process.env.DEFAULT_PREFIX || '-',
    
    // Music API Keys
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    
    // Database
    mongodbUri: process.env.MONGODB_URI,
    
    // Dashboard
    port: process.env.PORT || 3000,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
    discordRedirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
    
    // Bot Colors
    colors: {
        primary: '#9B59B6', // Purple theme
        error: '#E74C3C',
        success: '#2ECC71',
        info: '#3498DB'
    },
    
    // Embed Footer
    embedFooter: 'LunaHime Music Bot • Made with ❤️'
};

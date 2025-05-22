const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const config = require('../config');

class Dashboard {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.setupMiddleware();
        this.setupAuth();
        this.setupRoutes();
    }

    /**
     * Set up middleware
     */
    setupMiddleware() {
        // Set up view engine
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'ejs');

        // Set up static files
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Set up body parser
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Set up session
        this.app.use(session({
            secret: config.clientSecret,
            resave: false,
            saveUninitialized: false
        }));

        // Set up passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());
    }

    /**
     * Set up authentication
     */
    setupAuth() {
        // Set up Discord strategy
        passport.use(new Strategy({
            clientID: config.clientId,
            clientSecret: config.clientSecret,
            callbackURL: config.discordRedirectUri,
            scope: ['identify', 'guilds']
        }, (accessToken, refreshToken, profile, done) => {
            // Store user in session
            return done(null, profile);
        }));

        // Serialize user
        passport.serializeUser((user, done) => {
            done(null, user);
        });

        // Deserialize user
        passport.deserializeUser((user, done) => {
            done(null, user);
        });
    }

    /**
     * Set up routes
     */
    setupRoutes() {
        // Home route
        this.app.get('/', (req, res) => {
            res.render('index', {
                user: req.user,
                client: this.client
            });
        });

        // Commands route
        this.app.get('/commands', (req, res) => {
            res.render('commands', {
                user: req.user,
                client: this.client
            });
        });

        // Auth routes
        this.app.get('/auth/discord', passport.authenticate('discord'));

        this.app.get('/auth/discord/callback', passport.authenticate('discord', {
            failureRedirect: '/'
        }), (req, res) => {
            res.redirect('/dashboard');
        });

        this.app.get('/auth/logout', (req, res) => {
            req.logout(function(err) {
                if (err) {
                    console.error('Error during logout:', err);
                }
                res.redirect('/');
            });
        });

        // Dashboard routes
        this.app.get('/dashboard', this.isAuthenticated, (req, res) => {
            // Get user's guilds where they have admin permissions
            const guilds = req.user.guilds.filter(guild => {
                // Check if user is admin (permission 0x8 is ADMINISTRATOR)
                const isAdmin = (guild.permissions & 0x8) === 0x8;

                // Check if bot is in the guild
                const botInGuild = this.client.guilds.cache.has(guild.id);

                return isAdmin && botInGuild;
            });

            res.render('dashboard', {
                user: req.user,
                client: this.client,
                guilds
            });
        });

        // Guild dashboard route
        this.app.get('/dashboard/:guildId', this.isAuthenticated, (req, res) => {
            const guild = this.client.guilds.cache.get(req.params.guildId);

            // Check if guild exists
            if (!guild) {
                return res.redirect('/dashboard');
            }

            // Check if user has admin permissions
            const userGuild = req.user.guilds.find(g => g.id === guild.id);

            if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
                return res.redirect('/dashboard');
            }

            // Get guild settings
            const guildSettings = {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL({ dynamic: true }),
                memberCount: guild.memberCount
            };

            // Get music queue
            const musicPlayer = require('../music/MusicPlayer');
            const queue = musicPlayer.getQueue(guild.id);

            res.render('guild', {
                user: req.user,
                client: this.client,
                guild: guildSettings,
                queue
            });
        });

        // API routes
        this.app.get('/api/guilds/:guildId/queue', this.isAuthenticated, (req, res) => {
            const guild = this.client.guilds.cache.get(req.params.guildId);

            // Check if guild exists
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            // Check if user has admin permissions
            const userGuild = req.user.guilds.find(g => g.id === guild.id);

            if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Get music queue
            const musicPlayer = require('../music/MusicPlayer');
            const queue = musicPlayer.getQueue(guild.id);

            res.json({
                playing: queue ? queue.playing : false,
                songs: queue ? queue.songs : []
            });
        });

        // Guild settings API route
        this.app.get('/api/guilds/:guildId/settings', this.isAuthenticated, (req, res) => {
            const guild = this.client.guilds.cache.get(req.params.guildId);

            // Check if guild exists
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            // Check if user has admin permissions
            const userGuild = req.user.guilds.find(g => g.id === guild.id);

            if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Get guild settings from database
            const Guild = require('../database/models/Guild');
            Guild.findOne({ guildId: guild.id }).then(guildSettings => {
                // Get guild roles
                const roles = guild.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor
                })).sort((a, b) => b.position - a.position);

                res.json({
                    prefix: guildSettings ? guildSettings.prefix : '-',
                    djRole: guildSettings ? guildSettings.djRole : null,
                    roles
                });
            }).catch(err => {
                console.error('Error fetching guild settings:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
        });

        // Update guild settings API route
        this.app.post('/api/guilds/:guildId/settings', this.isAuthenticated, (req, res) => {
            const guild = this.client.guilds.cache.get(req.params.guildId);

            // Check if guild exists
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            // Check if user has admin permissions
            const userGuild = req.user.guilds.find(g => g.id === guild.id);

            if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Update guild settings
            const Guild = require('../database/models/Guild');
            Guild.findOneAndUpdate(
                { guildId: guild.id },
                {
                    prefix: req.body.prefix,
                    djRole: req.body.djRole
                },
                { upsert: true, new: true }
            ).then(guildSettings => {
                res.json({
                    success: true,
                    settings: guildSettings
                });
            }).catch(err => {
                console.error('Error updating guild settings:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
        });

        // Music control API routes
        this.app.post('/api/guilds/:guildId/music/:action', this.isAuthenticated, (req, res) => {
            const guild = this.client.guilds.cache.get(req.params.guildId);
            const action = req.params.action;

            // Check if guild exists
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            // Check if user has admin permissions
            const userGuild = req.user.guilds.find(g => g.id === guild.id);

            if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Get music queue
            const musicPlayer = require('../music/MusicPlayer');
            const queue = musicPlayer.getQueue(guild.id);

            // Check if there's a queue
            if (!queue || !queue.songs.length) {
                return res.status(404).json({ error: 'No music playing' });
            }

            // Perform action
            switch (action) {
                case 'pause':
                    queue.player.pause();
                    break;
                case 'resume':
                    queue.player.unpause();
                    break;
                case 'skip':
                    queue.player.stop();
                    break;
                case 'stop':
                    musicPlayer.leave(guild.id);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }

            res.json({ success: true });
        });
    }

    /**
     * Middleware to check if user is authenticated
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Express next function
     */
    isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/auth/discord');
    }

    /**
     * Start the dashboard
     */
    start() {
        this.app.listen(config.port, () => {
            console.log(`Dashboard listening on port ${config.port}`);
        });
    }
}

module.exports = Dashboard;

# LunaHime Discord Music Bot

LunaHime is a professional Discord Music Player Bot with support for Spotify, YouTube, SoundCloud, and Deezer. It features a beautiful web dashboard with a Japanese/Anime theme.

## Features

### 🎵 Supported Music Platforms

* Spotify
* YouTube
* SoundCloud
* Deezer

### ⚙️ Core Bot Features

All commands support **slash commands** and **prefix text commands** (default prefix: `-`).

| Command             | Description                                            | Access        |
| ------------------- | ------------------------------------------------------ | ------------- |
| play / -play <link> | Plays a song                                           | Everyone      |
| pause / -pause      | Pauses music                                           | DJ/Admin only |
| resume / -resume    | Resumes music                                          | DJ/Admin only |
| skip / -skip        | Skips current track                                    | DJ/Admin\*    |
| skipto / -st <#>    | Skips to specific queue position                       | DJ/Admin\*    |
| previous / -pr      | Plays previous track                                   | DJ/Admin\*    |
| queue / -q          | Displays current queue                                 | Everyone      |
| shuffle / -sh       | Shuffles the queue                                     | DJ/Admin only |
| seek / -s <time>    | Seeks current track                                    | DJ/Admin only |
| loop / -l           | Loops track or queue                                   | DJ/Admin only |
| clear / -c          | Clears the queue                                       | DJ/Admin only |
| join / -j           | Bot joins VC (warns if in another VC, option to force) | DJ/Admin only |
| leave / -le         | Bot leaves VC                                          | DJ/Admin only |
| info / -i           | Displays song info (with album art, time)              | Everyone      |

\*If more than 3 users are in the VC, uses a **voting system** (e.g., 3/5 must vote to skip).

### ✨ Extra Commands

| Command                | Description                           | Access     |
| ---------------------- | ------------------------------------- | ---------- |
| ping / -ping           | Shows latency                         | Everyone   |
| about / -about         | Bot info                              | Everyone   |
| help / -help           | Command guide                         | Everyone   |
| prefix / -prefix       | Displays current prefix               | Everyone   |
| setprefix / -setprefix | Changes prefix (text only, not slash) | Admin only |
| setdjrole / -setdjrole | Assigns DJ role                       | Admin only |

### 🌐 Web Dashboard

* Built with Discord OAuth2 login
* User can control bot via web interface (play, pause, queue, etc.)
* Only shows servers where the user is **admin** or has **DJ role**
* UI/UX reflects a **Japanese/Anime theme** (AniList style)
* Primary color: **Purple-themed**
* Responsive and polished frontend

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/lunahime.git
   cd lunahime
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Bot Configuration
   TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   CLIENT_SECRET=your_discord_client_secret
   DEFAULT_PREFIX=-

   # Music API Keys
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

   # Database
   MONGODB_URI=your_mongodb_uri

   # Dashboard
   PORT=3000
   DASHBOARD_URL=http://localhost:3000
   DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
   ```

4. Start the bot:
   ```
   npm start
   ```

## Development

For development with auto-restart:
```
npm run dev
```

## Technologies Used

* [discord.js v14.19.3](https://discord.js.org/docs/packages/discord.js/14.19.3)
* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/)
* [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
* [YouTube API](https://developers.google.com/youtube/v3)
* [SoundCloud API](https://developers.soundcloud.com/)
* [Deezer API](https://developers.deezer.com/)

## License

This project is licensed under the ISC License.

## Acknowledgements

* [Discord API](https://discord.com/developers/docs)
* [discord.js](https://discord.js.org/)
* [play-dl](https://github.com/play-dl/play-dl)
* [ytdl-core](https://github.com/fent/node-ytdl-core)
* [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node)
* [soundcloud-downloader](https://github.com/zackradisic/node-soundcloud-downloader)

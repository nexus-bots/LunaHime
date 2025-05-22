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

# VocchiAssistant
This Discord bot is for self assistant usage

## Setup

1. Clone the repository or download the files.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Discord bot token.
4. Run the bot: `npm start`

## Getting a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application.
3. Go to the "Bot" section and create a bot.
4. Copy the token and paste it into `.env` as `DISCORD_TOKEN`.

## Features

- `/ping` - Replies with Pong!
- `/生日提醒 新增 <用戶>` - 新增生日提醒（使用下拉選單選擇月份和日期）
- `/生日提醒 刪除` - 刪除生日提醒（使用下拉選單選擇用戶）
- `/生日提醒 列表` - 查看所有生日提醒
- `/生日提醒 測試 <用戶>` - 測試生日提醒功能（模擬指定用戶明天生日）
- Daily reminder at 23:50 for birthdays tomorrow

## Project Structure

- `commands/` - Slash commands organized by feature
  - `ping.js` - Basic ping command
  - `birthday/` - Birthday-related commands (legacy)
- `function/` - Modular features
  - `birthday/` - Birthday reminder module
    - `commands.js` - Command definitions
    - `index.js` - Core functions
    - `event.js` - Event handlers
- `util/` - Utility files
  - `database.js` - SQLite database operations
- `db/` - Database files
  - `data.db` - Main database file
- `index.js` - Main bot file

## Development

Use `npm run dev` for development with nodemon.

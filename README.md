# VocchiAssistant
This Discord bot is for self assistant usage

## Setup

### Local Development
1. Clone the repository or download the files.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Discord bot token.
4. Run the bot: `npm start`

### Docker Deployment
1. Ensure you have Docker and Docker Compose installed.
2. Copy `.env.example` to `.env` and add your Discord bot token.
3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
4. Setup AI model (run once):
   ```bash
   docker-compose exec bot npm run setup-ai
   ```

### Getting a Discord Bot Token

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
- `/殘響 <內容> [希望收到回覆]` - 記錄你的心聲，每天只能輸入一次
- `/殘響記錄 <天數>` - 查看最近的殘響記錄
- `/殘響銷毀` - 刪除所有殘響記錄
- Daily reminder at 23:50 for birthdays tomorrow
- AI回覆功能：凌晨2-5點隨機時間回覆希望收到回覆的用戶

## AI Setup

殘響功能包含AI回覆，需要設置本地AI模型：

1. 安裝Docker
2. 啟動Ollama容器：`docker-compose up -d`
3. 拉取Mistral模型：`npm run setup-ai`
4. 確保Ollama運行在 http://localhost:11434

AI回覆風格：夢幻、飄忽、沒重點，像半夢半醒的夢話。

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

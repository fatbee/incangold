# Incangold Discord Bot

A Discord bot for playing the Incangold game in your Discord server. Built with Discord.js v14.

## Features

- **Slash Commands**: Easy-to-use slash commands for all bot functions
- **Interactive Game**: Play Incangold directly in Discord with interactive buttons
- **Welcome Messages**: Automatic welcome messages for new server members
- **Simple Setup**: Easy to set up and configure

## Commands

- `/ping` - Check the bot's latency
- `/help` - Display all available commands
- `/game` - Start a new Incangold game

## Game Rules

Incangold is a push-your-luck game where players explore a temple to collect treasures:

1. **Objective**: Collect as much treasure as possible without getting trapped in the temple.
2. **Gameplay**: Each turn, you can choose to continue exploring or return to camp with your treasures.
3. **Treasures**: As you explore, you'll find treasures of different values.
4. **Dangers**: Beware of traps and dangers! If you encounter the same danger twice, you lose all treasures you haven't returned to camp.
5. **Winning**: The player with the most treasure at the end of the game wins!

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Discord bot token:
   ```
   CLIENT_TOKEN="YOUR_BOT_TOKEN_HERE"
   ```
4. Update the `config.js` file with your Discord user ID and server ID
5. Start the bot: `npm start`

## Requirements

- Node.js v16.11.0 or newer
- Discord.js v14
- A Discord bot token

## Dependencies
- **colors** → latest
- **discord.js** → 14.13.0 or newer
- **dotenv** → latest
- **quick-yaml.db** → latest

## Credits

- Built using [DiscordJS-V14-Bot-Template](https://github.com/TFAGaming/DiscordJS-V14-Bot-Template) by TFAGaming
- Inspired by the Incangold board game

## License

GPL-3.0
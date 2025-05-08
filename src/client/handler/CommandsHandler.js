const { REST, Routes } = require('discord.js');
const { info, error, success } = require('../../utils/Console');
const { readdirSync, statSync } = require('fs');
const path = require('path');
const DiscordBot = require('../DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const MessageCommand = require('../../structure/MessageCommand');

class CommandsHandler {
    client;

    /**
     *
     * @param {DiscordBot} client
     */
    constructor(client) {
        this.client = client;
    }

    load = () => {
        this.loadCommandsFromDirectory('./src/commands');

        success(`Successfully loaded ${this.client.collection.application_commands.size} application commands and ${this.client.collection.message_commands.size} message commands.`);
    }

    /**
     * Recursively load commands from a directory and its subdirectories
     * @param {string} dir - Directory to load commands from
     */
    loadCommandsFromDirectory = (dir) => {
        const items = readdirSync(dir);

        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = statSync(itemPath);

            if (stats.isDirectory()) {
                // Recursively load commands from subdirectory
                this.loadCommandsFromDirectory(itemPath);
            } else if (item.endsWith('.js')) {
                // Load command file
                this.loadCommandFile(itemPath);
            }
        }
    }

    /**
     * Load a command from a file
     * @param {string} filePath - Path to the command file
     */
    loadCommandFile = (filePath) => {
        try {
            // Get relative path for require
            const relativePath = path.relative('./src', filePath).replace(/\\/g, '/');
            const module = require('../../' + relativePath);

            if (!module) return;

            if (module.__type__ === 2) {
                if (!module.command || !module.run) {
                    error('Unable to load the message command ' + filePath);
                    return;
                }

                // Check for duplicate message command
                if (this.client.collection.message_commands.has(module.command.name)) {
                    error(`Duplicate message command name '${module.command.name}' in ${filePath}. Skipping.`);
                    return;
                }

                this.client.collection.message_commands.set(module.command.name, module);

                if (module.command.aliases && Array.isArray(module.command.aliases)) {
                    module.command.aliases.forEach((alias) => {
                        this.client.collection.message_commands_aliases.set(alias, module.command.name);
                    });
                }

                info('Loaded new message command: ' + path.basename(filePath));
            } else if (module.__type__ === 1) {
                if (!module.command || !module.run) {
                    error('Unable to load the application command ' + filePath);
                    return;
                }

                // Check for duplicate application command
                if (this.client.collection.application_commands.has(module.command.name)) {
                    error(`Duplicate application command name '${module.command.name}' in ${filePath}. Skipping.`);
                    return;
                }

                // Check for duplicate in rest_application_commands_array
                const isDuplicate = this.client.rest_application_commands_array.some(cmd => cmd.name === module.command.name);
                if (isDuplicate) {
                    error(`Duplicate application command name '${module.command.name}' in ${filePath}. Skipping.`);
                    return;
                }

                this.client.collection.application_commands.set(module.command.name, module);
                this.client.rest_application_commands_array.push(module.command);

                info('Loaded new application command: ' + path.basename(filePath));
            } else {
                error('Invalid command type ' + module.__type__ + ' from command file ' + filePath);
            }
        } catch (err) {
            error('Unable to load a command from the path: ' + filePath);
            error(err);
        }
    }

    reload = () => {
        this.client.collection.message_commands.clear();
        this.client.collection.message_commands_aliases.clear();
        this.client.collection.application_commands.clear();
        this.client.rest_application_commands_array = [];

        this.load();
    }

    /**
     * @param {{ enabled: boolean, guildId: string }} development
     * @param {Partial<import('discord.js').RESTOptions>} restOptions
     */
    registerApplicationCommands = async (development, restOptions = null) => {
        const rest = new REST(restOptions ? restOptions : { version: '10' }).setToken(this.client.token);

        if (development.enabled) {
            await rest.put(Routes.applicationGuildCommands(this.client.user.id, development.guildId), { body: this.client.rest_application_commands_array });
        } else {
            await rest.put(Routes.applicationCommands(this.client.user.id), { body: this.client.rest_application_commands_array });
        }
    }
}

module.exports = CommandsHandler;
const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder } = require('discord.js');
const messageManager = require('../../../utils/MessageManager');

module.exports = new ApplicationCommand({
    command: {
        name: messageManager.getMessage('command.ping.name'),
        description: messageManager.getMessage('command.ping.description'),
    },
    run: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle(messageManager.getMessage('ping.title'))
            .setDescription(messageManager.getMessage('ping.description', client.ws.ping))
            .setColor(messageManager.getMessage('general.color'))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}).toJSON();

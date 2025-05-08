const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder } = require('discord.js');
const messageManager = require('../../../utils/MessageManager');

module.exports = new ApplicationCommand({
    command: {
        name: messageManager.getMessage('command.help.name'),
        description: messageManager.getMessage('command.help.description'),
    },
    run: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle(messageManager.getMessage('help.title'))
            .setDescription(messageManager.getMessage('help.description'))
            .addFields(
                {
                    name: messageManager.getMessage('help.ping.name'),
                    value: messageManager.getMessage('help.ping.value')
                },
                {
                    name: messageManager.getMessage('help.help.name'),
                    value: messageManager.getMessage('help.help.value')
                },
                {
                    name: messageManager.getMessage('help.game.name'),
                    value: messageManager.getMessage('help.game.value')
                }
            )
            .setColor(messageManager.getMessage('general.color'))
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}).toJSON();

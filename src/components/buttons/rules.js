const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');
const { getImageAttachment } = require('../../utils/configManager');

module.exports = new Component({
    customId: 'rules',
    type: 'button',
    run: async (client, interaction) => {
        // Get a random danger image to display with the rules
        const dangerTypes = ['snake', 'spider', 'mummy', 'fire', 'rockfall'];
        const randomDanger = dangerTypes[Math.floor(Math.random() * dangerTypes.length)];
        const imageData = getImageAttachment(`image.danger.${randomDanger}`);

        // Create attachments array for the files
        const attachments = [];
        if (imageData.attachment) {
            attachments.push(imageData.attachment);
        }

        // Create a rules embed
        const rulesEmbed = new EmbedBuilder()
            .setTitle(messageManager.getMessage('rules.title'))
            .setDescription(messageManager.getMessage('rules.description'))
            .setColor(messageManager.getMessage('general.color'));

        // Set the image if available
        if (imageData.url) {
            rulesEmbed.setImage(imageData.url);
        }

        rulesEmbed.addFields(
                {
                    name: messageManager.getMessage('rules.objective.title'),
                    value: messageManager.getMessage('rules.objective.value')
                },
                {
                    name: messageManager.getMessage('rules.gameplay.title'),
                    value: messageManager.getMessage('rules.gameplay.value')
                },
                {
                    name: messageManager.getMessage('rules.gold.title'),
                    value: messageManager.getMessage('rules.gold.value')
                },
                {
                    name: messageManager.getMessage('rules.dangers.title'),
                    value: messageManager.getMessage('rules.dangers.value')
                },
                {
                    name: messageManager.getMessage('rules.rounds.title'),
                    value: messageManager.getMessage('rules.rounds.value')
                },
                {
                    name: messageManager.getMessage('rules.winning.title'),
                    value: messageManager.getMessage('rules.winning.value')
                }
            )
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

        // Create a back button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_game')
                    .setLabel(messageManager.getMessage('button.back_to_game'))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(messageManager.getMessage('emoji.back_to_game'))
            );

        await interaction.update({ embeds: [rulesEmbed], components: [row], files: attachments });
    }
}).toJSON();

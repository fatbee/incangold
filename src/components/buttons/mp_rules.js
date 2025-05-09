const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');
const { getImageAttachment } = require('../../utils/configManager');

module.exports = new Component({
    customId: 'mp_rules',
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
            .setTitle(messageManager.getMessage('mp.rules.title'))
            .setDescription(messageManager.getMessage('mp.rules.description'))
            .setColor(messageManager.getMessage('general.color'));

        // Set the image if available
        if (imageData.url) {
            rulesEmbed.setImage(imageData.url);
        }

        rulesEmbed.addFields(
                {
                    name: messageManager.getMessage('mp.rules.objective.title'),
                    value: messageManager.getMessage('mp.rules.objective.value')
                },
                {
                    name: messageManager.getMessage('mp.rules.gameplay.title'),
                    value: messageManager.getMessage('mp.rules.gameplay.value')
                },
                {
                    name: messageManager.getMessage('mp.rules.gold.title'),
                    value: messageManager.getMessage('mp.rules.gold.value')
                },
                {
                    name: messageManager.getMessage('mp.rules.dangers.title'),
                    value: messageManager.getMessage('mp.rules.dangers.value')
                },
                {
                    name: messageManager.getMessage('mp.rules.rounds.title'),
                    value: messageManager.getMessage('mp.rules.rounds.value')
                },
                {
                    name: messageManager.getMessage('mp.rules.winning.title'),
                    value: messageManager.getMessage('mp.rules.winning.value')
                }
            )
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

        // Send as a new message instead of updating the existing one
        // No buttons are added
        await interaction.reply({ 
            embeds: [rulesEmbed], 
            files: attachments,
            ephemeral: true // Make it only visible to the user who clicked the button
        });
    }
}).toJSON(); // Make sure to call toJSON()



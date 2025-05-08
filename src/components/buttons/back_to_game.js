const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');
const { getImageAttachment } = require('../../utils/configManager');

// 確保使用正確的 Component 類
const component = new Component({
    customId: 'back_to_game',
    type: 'button',
    run: async (client, interaction) => {
        try {
        // Get the welcome image
        const imageData = getImageAttachment('game.welcome.image');

        // Create attachments array for the files
        const attachments = [];
        if (imageData.attachment) {
            attachments.push(imageData.attachment);
        }

        // Create a welcome embed for the game
        const gameEmbed = new EmbedBuilder()
            .setTitle(messageManager.getMessage('game.welcome.title'))
            .setDescription(messageManager.getMessage('game.welcome.description'))
            .setColor(messageManager.getMessage('general.color'))
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

        // Set the image if available
        if (imageData.url) {
            gameEmbed.setImage(imageData.url);
        }

        // Create a button for starting the game
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_game')
                    .setLabel(messageManager.getMessage('button.start_game'))
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(messageManager.getMessage('emoji.start_game')),
                new ButtonBuilder()
                    .setCustomId('rules')
                    .setLabel(messageManager.getMessage('button.game_rules'))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(messageManager.getMessage('emoji.game_rules'))
            );

        await interaction.update({ embeds: [gameEmbed], components: [row], files: attachments });
        } catch (error) {
            console.error('返回遊戲時發生錯誤:', error);
            // 嘗試回覆一個錯誤消息
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '返回遊戲時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '返回遊戲時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('無法回覆錯誤消息:', replyError);
            }
        }
    }
});

// 導出組件
module.exports = component.toJSON();

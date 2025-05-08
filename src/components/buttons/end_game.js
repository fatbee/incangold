const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder } = require('discord.js');
const { getImageAttachment } = require('../../utils/configManager');
const gameStateManager = require('../../utils/GameStateManager');

module.exports = new Component({
    customId: 'end_game',
    type: 'button',
    run: async (client, interaction) => {
        // 獲取玩家ID和遊戲狀態
        const userId = interaction.user.id;
        let gameState = gameStateManager.getGameState(userId);

        // 獲取總寶藏數量（只包括已保存的）
        let totalTreasures = 0;
        if (gameState) {
            totalTreasures = gameState.securedTreasures;
            // 重置遊戲狀態
            gameStateManager.resetGameState(userId);
        }

        // Get a treasure image to display at the end
        const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
        const randomTreasure = treasureValues[Math.floor(Math.random() * treasureValues.length)];
        const imageData = getImageAttachment(`image.treasure.${randomTreasure}`);

        // Create attachments array for the files
        const attachments = [];
        if (imageData.attachment) {
            attachments.push(imageData.attachment);
        }

        // 獲取事件記錄
        const eventLog = gameStateManager.getEventLog(userId);
        const eventLogText = eventLog.length > 0 ? eventLog.join(', ') : '無';

        // Create an end game embed
        const endGameEmbed = new EmbedBuilder()
            .setTitle('🏆 遊戲結束')
            .setDescription(`感謝遊玩印加寶藏！你的最終得分是 ${totalTreasures} 金幣。\n\n使用 \`/game\` 指令開始新遊戲。`)
            .setColor('#FFD700') // Gold color
            .addFields(
                { name: '最終得分', value: `${totalTreasures} 金幣`, inline: true },
                { name: '遊戲事件記錄', value: eventLogText }
            )
            .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

        // Set the image if available
        if (imageData.url) {
            endGameEmbed.setImage(imageData.url);
        }

        await interaction.update({ embeds: [endGameEmbed], components: [], files: attachments });
    }
}).toJSON();

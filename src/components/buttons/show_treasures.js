const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const gameStateManager = require('../../utils/GameStateManager');
const timerManager = require('../../utils/TimerManager');

module.exports = new Component({
    customId: 'show_treasures',
    type: 'button',
    run: async (client, interaction) => {
        // 獲取玩家ID和遊戲狀態
        const userId = interaction.user.id;
        let gameState = gameStateManager.getGameState(userId);

        // 清除計時器
        timerManager.clearTimer(userId);

        // 如果沒有遊戲狀態，初始化一個新的
        if (!gameState) {
            gameState = gameStateManager.initializeGameState(userId);
        }

        // 檢查是否在返回營地後（通過檢查行動次數是否為0）
        if (gameState.actionsInRound === 0 && gameState.currentRound > 1) {
            // 如果是新回合開始，寶藏應該為0
            gameState.treasures = 0;
        } else {
            // 否則計算當前回合中收集的所有寶藏總和
            const currentRoundTreasures = gameStateManager.calculateCurrentRoundTreasures(userId);
            // 更新遊戲狀態中的寶藏值
            gameState.treasures = currentRoundTreasures;
        }

        // 獲取總寶藏數量（只包括已保存的）
        const totalTreasures = gameState.securedTreasures;

        // 創建一個嵌入訊息，只有玩家自己可見
        const treasureEmbed = new EmbedBuilder()
            .setTitle('💰 你的寶藏')
            .setDescription(`這是你當前的寶藏信息，只有你能看到這條訊息。`)
            .setColor('#FFD700') // Gold color
            .addFields(
                { name: '當前回合寶藏', value: `${gameState.treasures} 金幣`, inline: true },
                { name: '已保存寶藏', value: `${gameState.securedTreasures} 金幣`, inline: true },
                { name: '總寶藏', value: `${totalTreasures} 金幣`, inline: true }
            )
            .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

        // 使用 ephemeral 回覆，只有玩家自己可見
        await interaction.reply({
            embeds: [treasureEmbed],
            ephemeral: true // 設置為 true，使訊息只有玩家自己可見
        });
    }
}).toJSON();

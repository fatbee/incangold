const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getImageAttachment } = require('../../utils/configManager');
const gameStateManager = require('../../utils/GameStateManager');
const timerManager = require('../../utils/TimerManager');

module.exports = new Component({
    customId: 'return_to_camp',
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

        // 計算當前回合中收集的所有寶藏總和
        const currentRoundTreasures = gameStateManager.calculateCurrentRoundTreasures(userId);

        // 更新遊戲狀態中的寶藏值
        gameState.treasures = currentRoundTreasures;

        // 保存當前寶藏
        const securedAmount = gameStateManager.secureTreasures(userId);

        // 重置當前回合寶藏
        gameState.treasures = 0;

        // 檢查是否是從死亡畫面過來
        // 使用遊戲狀態中的標記來確定
        const isDeath = gameState.diedFromDanger === true;

        // 如果不是從死亡畫面過來，才清除事件記錄
        // 如果是從死亡畫面過來，會在後面處理
        if (!isDeath) {
            // 清除事件記錄，為新回合做準備
            gameState.eventLog = [];
        }

        // 獲取總寶藏數量（只包括已保存的）
        const totalTreasures = gameStateManager.getTotalTreasures(userId);

        // 完成當前回合並開始新回合（無論是否進行了行動）
        // 只有在從死亡畫面過來時才不增加回合數，因為在遇到重複危險時已經增加了回合數
        if (!isDeath) {
            gameStateManager.completeRoundAndStartNext(userId);
        }

        // 重新獲取更新後的遊戲狀態
        gameState = gameStateManager.getGameState(userId);

        // 檢查是否達到最大回合數
        const isMaxRoundsReached = gameStateManager.isMaxRoundsReached(userId);

        // Get a treasure image to display the secured treasure
        const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
        const randomTreasure = treasureValues[Math.floor(Math.random() * treasureValues.length)];
        const imageData = getImageAttachment(`image.treasure.${randomTreasure}`);

        // Create attachments array for the files
        const attachments = [];
        if (imageData.attachment) {
            attachments.push(imageData.attachment);
        }

        // 如果是從死亡畫面過來，清除事件記錄並重置標記
        if (isDeath) {
            gameState.diedFromDanger = false;
            // 清除事件記錄，為新回合做準備
            gameState.eventLog = [];
        }

        // 獲取事件記錄
        const eventLog = gameStateManager.getEventLog(userId);
        const eventLogText = eventLog.length > 0 ? eventLog.join(', ') : '無';

        const embed = new EmbedBuilder()
            .setTitle(isDeath ? '💀 回合結束' : '🏕️ 返回營地')
            .setDescription(isDeath ?
                `你在這回合中遇到了相同的危險兩次，失去了所有未保存的寶藏。${isMaxRoundsReached ? '\n\n**你已完成所有5回合！遊戲結束。**' : '\n\n**進入下一回合！**'}` :
                `你安全地帶著 ${securedAmount} 金幣返回營地！你的寶藏現在安全了。${isMaxRoundsReached ? '\n\n**你已完成所有5回合！遊戲結束。**' : '\n\n**進入下一回合！**'}`)
            .setColor(isDeath ? '#FF0000' : '#00FF00') // Red for death, Green for success
            .addFields(
                { name: '當前回合', value: `${gameState.currentRound}/${gameState.maxRounds}`, inline: true },
                { name: '行動次數', value: `${gameState.actionsInRound}/${gameState.maxActionsPerRound}`, inline: true },
                { name: '事件記錄', value: eventLogText }
            )
            .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

        // Set the image if available
        if (imageData.url) {
            embed.setImage(imageData.url);
        }

        // 如果達到最大回合數，不顯示任何按鈕，並提示使用命令
        if (isMaxRoundsReached) {
            // 重置遊戲狀態
            gameStateManager.resetGameState(userId);

            // 在描述中添加使用命令的提示
            embed.setDescription(isDeath ?
                `你在這回合中遇到了相同的危險兩次，失去了所有未保存的寶藏。\n\n**你已完成所有5回合！遊戲結束。**\n\n使用 \`/game\` 指令開始新遊戲。` :
                `你安全地帶著 ${securedAmount} 金幣返回營地！你的寶藏現在安全了。\n\n**你已完成所有5回合！遊戲結束。**\n\n使用 \`/game\` 指令開始新遊戲。`);

            // 不添加任何按鈕，直接更新
            await interaction.update({ embeds: [embed], components: [], files: attachments });
        } else {
            // 否則顯示新探險和查看寶藏按鈕
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('start_game')
                        .setLabel('新探險')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setCustomId('show_treasures')
                        .setLabel('查看寶藏')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('💰')
                );

            await interaction.update({ embeds: [embed], components: [row], files: attachments });
        }
    }
}).toJSON();

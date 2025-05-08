const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');
const { getImageAttachment } = require('../../utils/configManager');
const gameStateManager = require('../../utils/GameStateManager');
const timerManager = require('../../utils/TimerManager');

/**
 * 將英文危險類型轉換為中文
 * @param {string} dangerType - 英文危險類型
 * @returns {string} 中文危險類型
 */
function translateDangerType(dangerType) {
    switch (dangerType) {
        case 'snake':
            return '蛇';
        case 'spider':
            return '蜘蛛';
        case 'mummy':
            return '木乃伊';
        case 'fire':
            return '火';
        case 'rockfall':
            return '落石';
        default:
            return '未知危險';
    }
}

// 確保使用正確的 Component 類
const component = new Component({
    customId: 'start_game',
    type: 'button',
    run: async (client, interaction) => {
        try {
        // 初始化玩家的遊戲狀態
        const userId = interaction.user.id;
        // 檢查是否已有遊戲狀態
        let existingGameState = gameStateManager.getGameState(userId);

        // 如果已有遊戲狀態且不是第一回合
        if (existingGameState && existingGameState.currentRound > 1) {
            // 清除事件記錄，為新回合做準備
            existingGameState.eventLog = [];
            // 確保當前回合寶藏為0
            existingGameState.treasures = 0;
        } else {
            // 如果沒有遊戲狀態或是第一回合，則初始化新的遊戲狀態
            gameStateManager.initializeGameState(userId);
        }

        const gameState = gameStateManager.getGameState(userId);
        // Get a random treasure image to display at the start
        const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
        const randomTreasure = treasureValues[Math.floor(Math.random() * treasureValues.length)];
        const imageData = getImageAttachment(`image.treasure.${randomTreasure}`);

        // Create attachments array for the files
        const attachments = [];
        if (imageData.attachment) {
            attachments.push(imageData.attachment);
        }

        // Create a game started embed
        const gameStartedEmbed = new EmbedBuilder()
            .setTitle(messageManager.getMessage('game.started.title'))
            .setDescription(messageManager.getMessage('game.started.description'))
            .setColor(messageManager.getMessage('general.color'))
            .addFields(
                {
                    name: '回合',
                    value: `${gameState.currentRound}/${gameState.maxRounds}`,
                    inline: true
                },
                {
                    name: '行動次數',
                    value: `${gameState.actionsInRound}/${gameState.maxActionsPerRound}`,
                    inline: true
                },
                {
                    name: '⏱️ 自動行動倒數',
                    value: '20 秒',
                    inline: false
                }
            )
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

        // Set the image if available
        if (imageData.url) {
            gameStartedEmbed.setImage(imageData.url);
        }

        // Create buttons for game actions
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('continue_exploring')
                    .setLabel(messageManager.getMessage('button.continue_exploring'))
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(messageManager.getMessage('emoji.continue_exploring')),
                new ButtonBuilder()
                    .setCustomId('show_treasures')
                    .setLabel('查看寶藏')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('return_to_camp')
                    .setLabel(messageManager.getMessage('button.return_to_camp'))
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(messageManager.getMessage('emoji.return_to_camp'))
            );

        const message = await interaction.update({ embeds: [gameStartedEmbed], components: [row], files: attachments });

        // 設置計時器，如果20秒內沒有操作，自動執行"繼續探索"
        timerManager.setTimer(
            userId,
            async () => {
                try {
                    // 獲取最新的遊戲狀態
                    let gameData = gameStateManager.getGameState(userId);

                    // 如果遊戲狀態不存在或已經改變，不執行自動操作
                    if (!gameData) {
                        return;
                    }

                    // 不模擬點擊按鈕，而是直接執行相同的邏輯
                    // 獲取最新的消息
                    const fetchedMessage = await interaction.message.fetch();

                    // 增加行動次數
                    gameStateManager.incrementAction(userId);

                    // 檢查是否達到最大行動次數
                    const isMaxActions = gameStateManager.isMaxActionsReached(userId);

                    // 檢查是否達到最大回合數
                    const isLastRound = gameData.currentRound === gameData.maxRounds;

                    // 初始化重複危險標誌
                    let isDuplicateDanger = false;
                    // 模擬尋找寶藏或危險
                    const outcomes = ['treasure', 'treasure', 'treasure', 'danger'];
                    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

                    // 寶藏值
                    const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];

                    // 危險類型
                    const dangerTypes = ['snake', 'spider', 'mummy', 'fire', 'rockfall'];

                    // 創建新的嵌入消息和按鈕
                    let embed;
                    let attachments = [];

                    if (outcome === 'treasure') {
                        // 找到寶藏
                        const treasureValue = treasureValues[Math.floor(Math.random() * treasureValues.length)];

                        // 記錄寶藏事件
                        gameStateManager.logEvent(userId, 'treasure', treasureValue);

                        // 計算當前回合中收集的所有寶藏總和
                        const currentRoundTreasures = gameStateManager.calculateCurrentRoundTreasures(userId);

                        // 更新遊戲狀態中的寶藏值
                        gameData.treasures = currentRoundTreasures;

                        // 獲取寶藏圖片
                        const imageData = getImageAttachment(`image.treasure.${treasureValue}`);
                        if (imageData.attachment) {
                            attachments.push(imageData.attachment);
                        }

                        // 獲取事件記錄
                        const eventLog = gameStateManager.getEventLog(userId);
                        const eventLogText = eventLog.length > 0 ? eventLog.join(', ') : '無';

                        embed = new EmbedBuilder()
                            .setTitle('💰 發現寶藏！')
                            .setDescription(`你找到了 ${treasureValue} 金幣！接下來你想做什麼？${isMaxActions ? '\n\n**你已達到本回合最大行動次數！**' : ''}${isLastRound ? '\n\n**這是最後一回合！**' : ''}`)
                            .setColor('#FFD700') // Gold color
                            .addFields(
                                { name: '回合', value: `${gameData.currentRound}/${gameData.maxRounds}`, inline: true },
                                { name: '行動次數', value: `${gameData.actionsInRound}/${gameData.maxActionsPerRound}`, inline: true },
                                { name: '事件記錄', value: eventLogText },
                                { name: '⏱️ 自動行動倒數', value: '20 秒', inline: false }
                            )
                            .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

                        // 設置圖片
                        if (imageData.url) {
                            embed.setImage(imageData.url);
                        }
                    } else {
                        // 遇到危險
                        const dangerType = dangerTypes[Math.floor(Math.random() * dangerTypes.length)];

                        // 檢查是否是重複的危險
                        isDuplicateDanger = gameStateManager.addDanger(userId, dangerType);

                        // 如果是重複的危險，玩家失去所有未保存的寶藏
                        if (isDuplicateDanger) {
                            gameData.treasures = 0;
                            // 設置一個標記，表示玩家遇到了重複危險
                            gameData.diedFromDanger = true;
                        }

                        // 記錄危險事件
                        gameStateManager.logEvent(userId, 'danger', dangerType);

                        // 獲取危險圖片
                        const imageData = getImageAttachment(`image.danger.${dangerType}`);
                        if (imageData.attachment) {
                            attachments.push(imageData.attachment);
                        }

                        // 獲取事件記錄
                        const eventLog = gameStateManager.getEventLog(userId);
                        const eventLogText = eventLog.length > 0 ? eventLog.join(', ') : '無';

                        embed = new EmbedBuilder()
                            .setTitle('⚠️ 前方危險！')
                            .setDescription(`你遇到了一個${translateDangerType(dangerType)}！${isDuplicateDanger ? '**糟糕！這是第二次遇到相同的危險，你失去了所有未保存的寶藏！本回合結束。**' : '小心，如果你在本回合中再次遇到相同的危險，你將失去所有寶藏！'}${isMaxActions ? '\n\n**你已達到本回合最大行動次數！**' : ''}${isLastRound ? '\n\n**這是最後一回合！**' : ''}`)
                            .setColor('#FF0000') // Red color for danger
                            .addFields(
                                { name: '回合', value: `${gameData.currentRound}/${gameData.maxRounds}`, inline: true },
                                { name: '行動次數', value: `${gameData.actionsInRound}/${gameData.maxActionsPerRound}`, inline: true },
                                { name: '事件記錄', value: eventLogText },
                                { name: '⏱️ 自動行動倒數', value: isDuplicateDanger ? '無' : '20 秒', inline: false }
                            )
                            .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

                        // 設置圖片
                        if (imageData.url) {
                            embed.setImage(imageData.url);
                        }
                    }

                    // 創建按鈕
                    const row = new ActionRowBuilder();

                    // 如果這是最後一回合或達到最大行動次數或遇到重複危險，只顯示返回營地按鈕
                    if (isLastRound || isMaxActions || (outcome === 'danger' && isDuplicateDanger)) {
                        // 如果是重複危險，完成當前回合並開始新回合
                        if (outcome === 'danger' && isDuplicateDanger) {
                            gameStateManager.completeRoundAndStartNext(userId);
                            row.addComponents(
                                new ButtonBuilder()
                                    .setCustomId('return_to_camp')
                                    .setLabel('繼續遊戲 (死亡，進入下一回合)')
                                    .setStyle(ButtonStyle.Danger)
                                    .setEmoji('💀')
                            );
                        } else {
                            const buttonLabel = isLastRound ? '返回營地 (最後一回合)' :
                                               isMaxActions ? '返回營地 (達到行動上限)' :
                                               '返回營地';
                            row.addComponents(
                                new ButtonBuilder()
                                    .setCustomId('return_to_camp')
                                    .setLabel(buttonLabel)
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji('🏕️')
                            );
                        }
                    } else {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('continue_exploring')
                                .setLabel('繼續探索')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('🔍'),
                            new ButtonBuilder()
                                .setCustomId('show_treasures')
                                .setLabel('查看寶藏')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('💰'),
                            new ButtonBuilder()
                                .setCustomId('return_to_camp')
                                .setLabel('返回營地')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('🏕️')
                        );
                    }

                    // 更新消息
                    await fetchedMessage.edit({ embeds: [embed], components: [row], files: attachments });

                    // 如果不是最後一回合、沒有達到最大行動次數、沒有遇到重複危險，設置新的計時器
                    if (!isLastRound && !isMaxActions && !(outcome === 'danger' && isDuplicateDanger)) {
                        // 設置計時器，如果20秒內沒有操作，自動執行"繼續探索"
                        timerManager.setTimer(
                            userId,
                            async () => {
                                // 遞歸調用自動繼續探索
                                try {
                                    // 獲取最新的遊戲狀態
                                    const newGameData = gameStateManager.getGameState(userId);

                                    // 如果遊戲狀態不存在或已經改變，不執行自動操作
                                    if (!newGameData) {
                                        return;
                                    }

                                    // 直接執行相同的邏輯（這裡會再次調用這個函數）
                                    // 注意：這裡不需要再次調用，因為計時器到期時會自動執行這個函數
                                } catch (error) {
                                    console.error('自動繼續探索時發生錯誤:', error);
                                }
                            },
                            // 更新倒數計時顯示的回調函數
                            async (remainingSeconds) => {
                                try {
                                    // 獲取最新的消息
                                    const fetchedMessage = await interaction.message.fetch();

                                    // 獲取當前的嵌入消息
                                    const currentEmbed = fetchedMessage.embeds[0];
                                    if (!currentEmbed) return;

                                    // 創建新的嵌入消息
                                    const updatedEmbed = EmbedBuilder.from(currentEmbed);

                                    // 更新倒數計時字段
                                    const fields = updatedEmbed.data.fields || [];
                                    const countdownFieldIndex = fields.findIndex(field => field.name.includes('⏱️'));

                                    if (countdownFieldIndex !== -1) {
                                        fields[countdownFieldIndex].value = `${remainingSeconds} 秒`;
                                        updatedEmbed.setFields(fields);

                                        // 更新消息
                                        await fetchedMessage.edit({ embeds: [updatedEmbed] });
                                    }
                                } catch (error) {
                                    console.error('更新倒數計時顯示時發生錯誤:', error);
                                }
                            }
                        );
                    } else {
                        // 如果是最後一回合、達到最大行動次數或遇到重複危險，清除計時器
                        timerManager.clearTimer(userId);
                    }
                } catch (error) {
                    console.error('自動繼續探索時發生錯誤:', error);
                }
            },
            // 更新倒數計時顯示的回調函數
            async (remainingSeconds) => {
                try {
                    // 獲取最新的消息
                    const fetchedMessage = await interaction.message.fetch();

                    // 獲取當前的嵌入消息
                    const currentEmbed = fetchedMessage.embeds[0];
                    if (!currentEmbed) return;

                    // 創建新的嵌入消息
                    const updatedEmbed = EmbedBuilder.from(currentEmbed);

                    // 更新倒數計時字段
                    const fields = updatedEmbed.data.fields || [];
                    const countdownFieldIndex = fields.findIndex(field => field.name.includes('⏱️'));

                    if (countdownFieldIndex !== -1) {
                        fields[countdownFieldIndex].value = `${remainingSeconds} 秒`;
                        updatedEmbed.setFields(fields);

                        // 更新消息
                        await fetchedMessage.edit({ embeds: [updatedEmbed] });
                    }
                } catch (error) {
                    console.error('更新倒數計時顯示時發生錯誤:', error);
                }
            }
        );
        } catch (error) {
            console.error('開始遊戲時發生錯誤:', error);
            // 嘗試回覆一個錯誤消息
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '遊戲開始時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '遊戲開始時發生錯誤，請稍後再試。',
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

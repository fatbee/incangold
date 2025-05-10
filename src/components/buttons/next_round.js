const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'next_round_',
    type: 'button',
    useStartsWith: true, // 使用前綴匹配
    run: async (client, interaction) => {
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customId = interaction.customId;
            console.log(`按鈕ID: ${customId}`);

            const parts = customId.split('_');
            console.log(`按鈕ID分割: ${parts.join(', ')}`);

            // 正確提取房間ID
            // 格式: next_round_room_1746765077408_335
            // 我們需要提取 "room_1746765077408_335"
            let roomId = null;
            if (parts.length >= 3) {
                // 從第三個部分開始拼接
                roomId = parts.slice(2).join('_');
                console.log(`提取的房間ID: ${roomId}`);
            }

            if (!roomId) {
                console.error('無法從按鈕ID獲取房間ID');
                await interaction.reply({
                    content: '無效的房間ID。',
                    ephemeral: true
                });
                return;
            }

            // 獲取玩家ID
            const userId = interaction.user.id;

            // 獲取房間
            const room = gameRoomManager.getRoom(roomId);
            if (!room) {
                await interaction.reply({
                    content: '房間不存在。',
                    ephemeral: true
                });
                return;
            }

            // 檢查玩家是否在房間中
            if (!room.players.includes(userId)) {
                await interaction.reply({
                    content: '你不在這個房間中。',
                    ephemeral: true
                });
                return;
            }

            // 檢查遊戲狀態
            if (room.status !== 'playing') {
                await interaction.reply({
                    content: '遊戲尚未開始或已經結束。',
                    ephemeral: true
                });
                return;
            }

            // 增加回合數
            if (room.gameState.currentRound < room.gameState.maxRounds) {
                // 如果當前回合數小於最大回合數，則增加回合數
                // 注意：在某些情況下（如重複危險），回合數可能已經增加
                room.gameState.currentRound++;
                console.log(`增加回合數: roomId=${room.id}, currentRound=${room.gameState.currentRound}`);
            } else {
                console.log(`已達到最大回合數，不再增加: roomId=${room.id}, currentRound=${room.gameState.currentRound}, maxRounds=${room.gameState.maxRounds}`);
            }

            // 檢查是否是最後一回合
            if (room.gameState.currentRound > room.gameState.maxRounds) {
                console.log(`已達到最大回合數，顯示最終結果: roomId=${room.id}, currentRound=${room.gameState.currentRound}, maxRounds=${room.gameState.maxRounds}`);

                // 遊戲結束
                room.status = 'finished';

                // 創建最終結果嵌入消息
                const finalEmbed = new EmbedBuilder()
                    .setTitle(`🏁 多人印加寶藏遊戲 - 遊戲結束`)
                    .setDescription(`遊戲結束！以下是最終結果：`)
                    .setColor('#0099ff')
                    .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                // 計算每個玩家的總金幣和寶藏
                const playerTotalGold = {};
                const playerTreasureInfo = {};

                for (const playerId of room.players) {
                    // 計算基本金幣（已保存的金幣）
                    const securedGold = room.gameState.playerSecuredGold[playerId] || 0;
                    const currentGold = room.gameState.playerGold[playerId] || 0;

                    // 獲取收集的寶藏
                    const treasures = room.gameState.playerCollectedTreasures[playerId] || [];
                    const treasureSum = treasures.reduce((sum, value) => sum + value, 0);

                    // 計算總分
                    playerTotalGold[playerId] = securedGold + currentGold + treasureSum;

                    // 保存寶藏信息
                    playerTreasureInfo[playerId] = {
                        treasures: treasures,
                        treasureSum: treasureSum,
                        securedGold: securedGold,
                        totalScore: playerTotalGold[playerId]
                    };
                }

                // 按金幣數量排序玩家
                const sortedPlayers = [...room.players].sort((a, b) => playerTotalGold[b] - playerTotalGold[a]);

                // 添加玩家信息
                for (let i = 0; i < sortedPlayers.length; i++) {
                    const playerId = sortedPlayers[i];
                    const playerName = room.playerNames[playerId];
                    const treasureInfo = playerTreasureInfo[playerId];
                    const rank = i + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

                    // 創建寶藏顯示文本
                    let treasureText = '';
                    if (treasureInfo.treasures.length > 0) {
                        treasureText = `\n已帶走寶藏: ${treasureInfo.treasures.map(t => `寶藏 ${t}`).join(', ')}`;
                    }

                    // 創建總分顯示文本
                    let scoreText = `金幣: ${treasureInfo.securedGold}`;
                    if (treasureInfo.treasureSum > 0) {
                        scoreText += ` + 寶藏: ${treasureInfo.treasureSum}`;
                    }
                    scoreText += ` = 總分: ${treasureInfo.totalScore}`;

                    finalEmbed.addFields({
                        name: `${medal} ${playerName}`,
                        value: scoreText + treasureText,
                        inline: false
                    });
                }

                // 創建按鈕
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`new_game_${room.id}`)
                            .setLabel('開始新遊戲')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🔄')
                    );

                // 獲取頻道和消息
                const channel = await client.channels.fetch(room.channelId);
                const message = await channel.messages.fetch(room.messageId);

                // 更新消息
                await message.edit({ embeds: [finalEmbed], components: [row] });

                // 回覆玩家
                await interaction.reply({
                    content: '遊戲結束！最終結果已顯示。',
                    ephemeral: true
                });

                // 解散房間
                gameRoomManager.disbandRoom(room.id);
                return;
            }

            // 如果不是最後一回合，則開始新回合
            const startNewRound = require('../../commands/application/chat/multiplayer').startNewRound;
            await startNewRound(client, room);

            // 回覆玩家
            await interaction.reply({
                content: '開始新回合！',
                ephemeral: true
            });
        } catch (error) {
            console.error('處理下一回合按鈕時發生錯誤:', error);
            try {
                await interaction.reply({
                    content: '處理你的選擇時發生錯誤，請稍後再試。',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('回覆錯誤:', replyError);
            }
        }
    }
}).toJSON();





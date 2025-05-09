const { Component } = require('../../structure/builders/component.js');
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
            if (room.gameState.currentRound <= room.gameState.maxRounds) {
                // 如果當前回合數小於等於最大回合數，則增加回合數
                // 注意：在某些情況下（如重複危險），回合數可能已經增加
                room.gameState.currentRound++;
                console.log(`增加回合數: roomId=${room.id}, currentRound=${room.gameState.currentRound}`);
            }

            // 開始新回合
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


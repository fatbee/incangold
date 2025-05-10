const { Component } = require('../../structure/builders/component.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'start_game_',
    type: 'button',
    // 使用 startsWith 而不是完全匹配，這樣可以處理帶有房間 ID 的 customId
    useStartsWith: true,
    run: async (client, interaction) => {
        console.log('執行開始遊戲按鈕組件');
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customId = interaction.customId;
            console.log(`按鈕ID: ${customId}`);

            const parts = customId.split('_');
            console.log(`按鈕ID分割: ${parts.join(', ')}`);

            // 正確提取房間ID
            // 格式: start_game_room_1746765077408_335
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
            console.log(`用戶ID: ${userId}`);

            // 獲取房間
            console.log(`嘗試獲取房間: ${roomId}`);
            const room = gameRoomManager.getRoom(roomId);
            if (!room) {
                console.error(`房間不存在: ${roomId}`);
                await interaction.reply({
                    content: '房間不存在。',
                    ephemeral: true
                });
                return;
            }
            console.log(`成功獲取房間: ${roomId}, 狀態: ${room.status}, 玩家數量: ${room.players.length}`);

            // 檢查是否是房主
            if (room.hostId !== userId) {
                console.error(`用戶不是房主: userId=${userId}, hostId=${room.hostId}`);
                await interaction.reply({
                    content: '只有房主可以開始遊戲。',
                    ephemeral: true
                });
                return;
            }
            console.log(`用戶是房主: ${userId}`);


            // 檢查遊戲狀態
            if (room.status !== 'waiting') {
                console.error(`遊戲狀態不是等待中: ${room.status}`);
                await interaction.reply({
                    content: '遊戲已經開始或已經結束。',
                    ephemeral: true
                });
                return;
            }
            console.log(`遊戲狀態正確: ${room.status}`);

            // 開始遊戲
            console.log(`嘗試開始遊戲: ${roomId}`);
            const success = gameRoomManager.startGame(roomId);
            if (!success) {
                console.error(`開始遊戲失敗: ${roomId}`);
                await interaction.reply({
                    content: '開始遊戲失敗。',
                    ephemeral: true
                });
                return;
            }
            console.log(`遊戲開始成功: ${roomId}, 新狀態: ${room.status}`);

            // 回覆玩家
            console.log(`回覆玩家: ${userId}`);
            await interaction.reply({
                content: '遊戲開始！',
                ephemeral: true
            });
            console.log(`回覆成功: ${userId}`);

            // 開始第一回合
            console.log(`嘗試開始第一回合: ${roomId}`);
            try {
                // 直接導入模塊
                console.log('嘗試導入 multiplayer 模塊');
                const multiplayer = require('../../commands/application/chat/multiplayer');
                console.log('成功導入 multiplayer 模塊');

                // 檢查 startNewRound 函數
                if (typeof multiplayer.startNewRound === 'function') {
                    console.log(`開始第一回合: roomId=${roomId}, currentRound=${room.gameState.currentRound}`);

                    // 檢查房間狀態
                    console.log(`房間狀態: ${room.status}, 當前回合: ${room.gameState.currentRound}`);

                    // 調用 startNewRound 函數
                    await multiplayer.startNewRound(client, room);
                    console.log(`第一回合開始成功: ${roomId}`);
                } else {
                    console.error('startNewRound 不是一個函數:', multiplayer.startNewRound);
                    await interaction.followUp({
                        content: '開始遊戲時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error(`導入或執行 startNewRound 時發生錯誤: ${error.message}`, error);
                console.error(`錯誤堆棧: ${error.stack}`);
                await interaction.followUp({
                    content: '開始遊戲時發生錯誤，請稍後再試。',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error(`處理開始遊戲按鈕時發生錯誤: ${error.message}`, error);
            console.error(`錯誤堆棧: ${error.stack}`);
            try {
                await interaction.reply({
                    content: '處理你的選擇時發生錯誤，請稍後再試。',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error(`回覆錯誤: ${replyError.message}`, replyError);
            }
        }
    }
}).toJSON();

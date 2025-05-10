const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');
const timerManager = require('../../utils/TimerManager');

module.exports = new Component({
    customId: 'mp_return_',
    type: 'button',
    // 使用 startsWith 而不是完全匹配，這樣可以處理帶有房間 ID 的 customId
    useStartsWith: true,
    run: async (client, interaction) => {
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customId = interaction.customId;
            console.log(`按鈕ID: ${customId}`);

            const parts = customId.split('_');
            console.log(`按鈕ID分割: ${parts.join(', ')}`);

            // 正確提取房間ID
            // 格式: mp_return_room_1746765077408_335
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

            // 檢查玩家是否已經返回營地（在當前回合或之前的行動中）
            const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[userId] === true;

            // 如果玩家已經返回營地，不允許再選擇行動
            if (hasReturnedToCamp) {
                await interaction.reply({
                    content: '你已經返回營地，無法再選擇行動，請等待下一回合。',
                    ephemeral: true
                });
                return;
            }

            // 設置玩家行動為"返回營地"
            gameRoomManager.setPlayerAction(userId, 'return');

            // 回覆玩家
            await interaction.reply({
                content: '你選擇了返回營地！',
                ephemeral: true
            });

            // 檢查是否所有玩家都已選擇行動
            if (gameRoomManager.allPlayersActed(roomId)) {
                // 清除計時器
                timerManager.clearTimer(`room_${roomId}`);

                // 更新遊戲消息
                const updateGameMessage = require('../../commands/application/chat/multiplayer').updateGameMessage;
                await updateGameMessage(client, room);

                // 檢查是否所有玩家都已返回營地
                const allPlayersReturned = room.players.every(playerId => {
                    // 檢查玩家是否已返回營地（在當前回合或之前的行動中）
                    const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;
                    // 檢查玩家是否在當前行動中選擇返回營地
                    const isReturningNow = room.gameState.playerActions[playerId] === 'return';
                    // 玩家已返回營地或當前選擇返回營地
                    return hasReturnedToCamp || isReturningNow;
                });

                // 如果所有玩家都已返回營地，處理回合結果
                // 否則，繼續遊戲流程（抽取下一張卡）
                if (allPlayersReturned) {
                    // 處理回合結果
                    const processRoundResult = require('../../commands/application/chat/multiplayer').processRoundResult;
                    await processRoundResult(client, room);
                } else {
                    // 繼續遊戲流程，抽取下一張卡
                    // 這裡不需要做任何事情，因為計時器會自動觸發下一個行動
                    // 但我們需要重新設置計時器，因為我們剛剛清除了它
                    const processAction = require('../../commands/application/chat/multiplayer').processAction;
                    if (typeof processAction === 'function') {
                        await processAction(client, room);
                    } else {
                        console.error('processAction 不是一個函數');
                    }
                }
            }
        } catch (error) {
            console.error('處理返回營地按鈕時發生錯誤:', error);
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





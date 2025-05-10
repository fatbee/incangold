const { Component } = require('../../structure/builders/component.js');
const gameRoomManager = require('../../utils/GameRoomManager');
const { EmbedBuilder } = require('discord.js');

module.exports = new Component({
    customId: 'join_room_',
    type: 'button',
    // 使用 startsWith 而不是完全匹配，這樣可以處理帶有房間 ID 的 customId
    useStartsWith: true,
    run: async (client, interaction) => {
        console.log('執行加入房間按鈕組件');
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customId = interaction.customId;
            console.log(`按鈕ID: ${customId}`);

            const parts = customId.split('_');
            console.log(`按鈕ID分割: ${parts.join(', ')}`);

            // 正確提取房間ID
            // 格式: join_room_room_1746765221828_85
            // 我們需要提取 "room_1746765221828_85"
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

            // 檢查遊戲狀態
            if (room.status !== 'waiting') {
                console.error(`遊戲狀態不是等待中: ${room.status}`);
                await interaction.reply({
                    content: '遊戲已經開始或已經結束，無法加入。',
                    ephemeral: true
                });
                return;
            }
            console.log(`遊戲狀態正確: ${room.status}`);

            // 檢查玩家是否已經在房間中
            if (room.players.includes(userId)) {
                console.error(`玩家已經在房間中: ${userId}`);
                await interaction.reply({
                    content: '你已經在房間中。',
                    ephemeral: true
                });
                return;
            }
            console.log(`玩家不在房間中: ${userId}`);

            
            // 獲取玩家名稱
            const playerName = interaction.user.username;
            console.log(`玩家名稱: ${playerName}`);

            // 將玩家添加到房間
            console.log(`嘗試將玩家添加到房間: ${userId}, ${playerName}`);
            const success = gameRoomManager.addPlayer(roomId, userId, playerName);
            if (!success) {
                console.error(`添加玩家失敗: ${roomId}, ${userId}`);
                await interaction.reply({
                    content: '加入房間失敗，請稍後再試。',
                    ephemeral: true
                });
                return;
            }
            console.log(`添加玩家成功: ${roomId}, ${userId}`);

            // 回覆玩家
            await interaction.reply({
                content: `你已成功加入房間 ${room.name || roomId}！`,
                ephemeral: true
            });
            console.log(`回覆成功: ${userId}`);

            // 更新房間消息
            try {
                console.log(`嘗試更新房間消息: ${roomId}`);
                const channel = await client.channels.fetch(room.channelId);
                const message = await channel.messages.fetch(room.messageId);

                // 獲取當前的嵌入消息
                const currentEmbed = message.embeds[0];
                if (!currentEmbed) {
                    console.error(`無法獲取當前嵌入消息: ${roomId}`);
                    return;
                }

                // 創建新的嵌入消息
                const updatedEmbed = EmbedBuilder.from(currentEmbed);

                // 更新玩家列表
                let playerList = '';
                for (let i = 0; i < room.players.length; i++) {
                    const playerId = room.players[i];
                    const playerName = room.playerNames[playerId];
                    playerList += `${i + 1}. ${playerName}\n`;
                }

                // 更新玩家列表字段
                const fields = updatedEmbed.data.fields || [];
                const playerFieldIndex = fields.findIndex(field => field.name === '玩家列表');
                if (playerFieldIndex !== -1) {
                    fields[playerFieldIndex].value = playerList || '暫無玩家';
                    updatedEmbed.setFields(fields);
                }

                // 獲取當前的按鈕
                const currentComponents = message.components;

                // 更新消息
                await message.edit({ embeds: [updatedEmbed], components: currentComponents });
                console.log(`房間消息已更新: ${roomId}`);
            } catch (updateError) {
                console.error(`更新房間消息時發生錯誤: ${roomId}`, updateError);
            }
        } catch (error) {
            console.error(`處理加入房間按鈕時發生錯誤: ${error.message}`, error);
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

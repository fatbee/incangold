const { Component } = require('../../structure/builders/component.js');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'add_player_',
    type: 'button',
    run: async (client, interaction) => {
        try {
            console.log('添加玩家按鈕被點擊');

            // 獲取房間ID（從按鈕ID中提取）
            const customIdParts = interaction.customId.split('_');
            const roomId = customIdParts.length >= 3 ? customIdParts[2] : null;
            const userId = interaction.user.id;

            // 檢查玩家是否在房間中
            const room = roomId ? gameRoomManager.getRoom(roomId) : gameRoomManager.getPlayerRoom(userId);
            if (!room) {
                await interaction.reply({
                    content: '無法找到房間。',
                    ephemeral: true
                });
                return;
            }

            // 檢查是否是房主
            if (room.hostId !== userId) {
                await interaction.reply({
                    content: '只有房主可以添加玩家到房間中。',
                    ephemeral: true
                });
                return;
            }

            // 提示用戶使用命令添加玩家
            await interaction.reply({
                content: `請使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`,
                ephemeral: true
            });

        } catch (error) {
            console.error('處理添加玩家按鈕時發生錯誤:', error);
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

const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'leave_room',
    type: 'button',
    run: async (client, interaction) => {
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customIdParts = interaction.customId.split('_');
            const roomId = customIdParts.length >= 3 ? customIdParts[2] : null;
            const userId = interaction.user.id;

            // 如果無法從按鈕ID獲取房間ID，嘗試從玩家的當前房間獲取
            if (!roomId) {
                const playerRoom = gameRoomManager.getPlayerRoom(userId);

                if (playerRoom) {
                    // 使用玩家當前所在的房間ID
                    console.log(`無法從按鈕ID獲取房間ID，使用玩家當前房間ID: ${playerRoom.id}`);
                    await leaveRoomProcess(client, interaction, playerRoom.id, userId);
                    return;
                } else {
                    await interaction.reply({
                        content: '無效的房間ID，且你不在任何房間中。',
                        ephemeral: true
                    });
                    return;
                }
            }

            // 處理離開房間
            await leaveRoomProcess(client, interaction, roomId, userId);
        } catch (error) {
            console.error('處理離開房間按鈕時發生錯誤:', error);
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

/**
 * 處理離開房間的邏輯
 * @param {Object} client - Discord客戶端
 * @param {Object} interaction - 交互對象
 * @param {string} roomId - 房間ID
 * @param {string} userId - 用戶ID
 */
async function leaveRoomProcess(client, interaction, roomId, userId) {
    try {
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
        if (room.status !== 'waiting') {
            await interaction.reply({
                content: '遊戲已經開始，無法離開房間。',
                ephemeral: true
            });
            return;
        }

        const isHost = room.hostId === userId;

        // 離開房間
        const success = gameRoomManager.leaveRoom(userId);
        if (!success) {
            await interaction.reply({
                content: '離開房間失敗。',
                ephemeral: true
            });
            return;
        }

        // 回覆玩家
        await interaction.reply({
            content: `成功離開房間 \`${roomId}\`。`,
            ephemeral: true
        });

        // 如果是房主離開，房間已經被解散
        if (isHost) {
            try {
                // 刪除消息
                await interaction.message.delete();
                console.log(`房主離開，已刪除房間消息: roomId=${roomId}`);
            } catch (error) {
                console.error('刪除房間消息錯誤:', error);

                // 如果無法刪除消息，嘗試編輯消息
                try {
                    const disbandEmbed = new EmbedBuilder()
                        .setTitle('🎮 多人印加寶藏遊戲房間')
                        .setDescription(`房間 \`${roomId}\` 已被解散。`)
                        .setColor('#ff0000')
                        .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                    await interaction.message.edit({ embeds: [disbandEmbed], components: [] });
                    console.log(`無法刪除消息，已更新為解散狀態: roomId=${roomId}`);
                } catch (editError) {
                    console.error('更新房間消息為解散狀態時發生錯誤:', editError);
                }
            }
        } else {
            // 更新房間信息
            const updatedRoom = gameRoomManager.getRoom(roomId);
            if (updatedRoom) {
                const playerList = updatedRoom.players.map((id, index) => {
                    const name = updatedRoom.playerNames[id];
                    return `${index + 1}. ${name}${id === updatedRoom.hostId ? ' (房主)' : ''}`;
                }).join('\n');

                const roomEmbed = new EmbedBuilder()
                    .setTitle('🎮 多人印加寶藏遊戲房間')
                    .setDescription(`房間ID: \`${roomId}\`\n\n等待其他玩家加入...\n\n使用 \`/multiplayer join room_id:${roomId}\` 加入此房間。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
                    .setColor('#0099ff')
                    .addFields(
                        { name: '房主', value: updatedRoom.playerNames[updatedRoom.hostId], inline: true },
                        { name: '玩家數量', value: updatedRoom.players.length.toString(), inline: true },
                        { name: '狀態', value: '等待中', inline: true },
                        { name: '玩家列表', value: playerList }
                    )
                    .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                // 創建按鈕
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`start_game_${roomId}`)
                            .setLabel('開始遊戲')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎮'),
                        new ButtonBuilder()
                            .setCustomId(`mp_rules`)
                            .setLabel('遊戲規則')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('📜'),
                        new ButtonBuilder()
                            .setCustomId(`show_commands`)
                            .setLabel('指令列表')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('📋'),
                        new ButtonBuilder()
                            .setCustomId(`leave_room`)
                            .setLabel('離開房間')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🚪')
                    );

                await interaction.message.edit({ embeds: [roomEmbed], components: [row] });
            }
        }
    } catch (error) {
        console.error('處理離開房間邏輯時發生錯誤:', error);
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

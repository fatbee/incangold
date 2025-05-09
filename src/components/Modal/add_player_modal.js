const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'add_player_modal_',
    type: 'modal',
    run: async (client, interaction) => {
        try {
            console.log('模態框提交被處理');
            console.log('模態框ID:', interaction.customId);

            // 獲取房間ID（從模態框ID中提取）
            const customIdParts = interaction.customId.split('_');
            console.log('模態框ID分割:', customIdParts);

            const roomId = customIdParts.length >= 4 ? customIdParts[3] : null;
            console.log('提取的房間ID:', roomId);

            const userId = interaction.user.id;
            console.log('用戶ID:', userId);

            // 獲取玩家輸入的ID
            const playerInput = interaction.fields.getTextInputValue('player_id');
            console.log('玩家輸入:', playerInput);

            // 處理可能的@提及格式
            let targetUserId = playerInput.trim();
            if (targetUserId.startsWith('<@') && targetUserId.endsWith('>')) {
                targetUserId = targetUserId.slice(2, -1);
                if (targetUserId.startsWith('!')) {
                    targetUserId = targetUserId.slice(1);
                }
            }
            console.log('處理後的目標用戶ID:', targetUserId);

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

            // 檢查房間狀態
            if (room.status !== 'waiting') {
                await interaction.reply({
                    content: '遊戲已經開始，無法添加玩家。',
                    ephemeral: true
                });
                return;
            }

            // 檢查目標玩家是否是自己
            if (targetUserId === userId) {
                await interaction.reply({
                    content: '你不能添加自己到房間中。',
                    ephemeral: true
                });
                return;
            }

            // 嘗試獲取目標用戶
            let targetUser;
            try {
                targetUser = await client.users.fetch(targetUserId);
            } catch (error) {
                await interaction.reply({
                    content: '無法找到該用戶，請確保ID正確。',
                    ephemeral: true
                });
                return;
            }

            // 檢查目標玩家是否已經在房間中
            if (room.players.includes(targetUserId)) {
                await interaction.reply({
                    content: `${targetUser.username} 已經在房間中。`,
                    ephemeral: true
                });
                return;
            }

            // 檢查目標玩家是否已經在其他房間中
            const targetUserRoom = gameRoomManager.getPlayerRoom(targetUserId);
            if (targetUserRoom) {
                await interaction.reply({
                    content: `${targetUser.username} 已經在另一個房間中。`,
                    ephemeral: true
                });
                return;
            }

            // 添加玩家到房間
            const success = gameRoomManager.joinRoom(
                room.id,
                targetUserId,
                targetUser.username,
                targetUser.displayAvatarURL()
            );

            if (!success) {
                await interaction.reply({
                    content: `添加 ${targetUser.username} 到房間失敗。`,
                    ephemeral: true
                });
                return;
            }

            // 更新房間信息
            const playerList = room.players.map((id, index) => {
                const name = room.playerNames[id];
                return `${index + 1}. ${name}${id === room.hostId ? ' (房主)' : ''}`;
            }).join('\n');

            const roomEmbed = new EmbedBuilder()
                .setTitle('🎮 多人印加寶藏遊戲房間')
                .setDescription(`房間ID: \`${room.id}\`\n\n等待其他玩家加入...\n\n使用 \`/multiplayer join room_id:${room.id}\` 加入此房間。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
                .setColor('#0099ff')
                .addFields(
                    { name: '房主', value: room.playerNames[room.hostId], inline: true },
                    { name: '玩家數量', value: room.players.length.toString(), inline: true },
                    { name: '狀態', value: '等待中', inline: true },
                    { name: '玩家列表', value: playerList }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 創建按鈕
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`start_game_${room.id}`)
                        .setLabel('開始遊戲')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎮'),
                    new ButtonBuilder()
                        .setCustomId(`mp_rules`)
                        .setLabel('遊戲規則')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📜'),
                    new ButtonBuilder()
                        .setCustomId(`leave_room`)
                        .setLabel('離開房間')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🚪')
                );

            try {
                // 更新原始消息
                const channel = await client.channels.fetch(room.channelId);
                const message = await channel.messages.fetch(room.messageId);
                await message.edit({ embeds: [roomEmbed], components: [row] });

                // 回覆房主
                await interaction.reply({
                    content: `成功將 ${targetUser.username} 添加到房間中。`,
                    ephemeral: true
                });

                // 通知被添加的玩家
                try {
                    await targetUser.send({
                        content: `你已被 ${interaction.user.username} 添加到印加寶藏遊戲房間中。\n房間ID: \`${room.id}\`\n\n你可以使用 \`/multiplayer leave\` 離開房間。`,
                    });
                } catch (dmError) {
                    console.error('無法發送私信給玩家:', dmError);
                    // 如果無法發送私信，不中斷流程
                }

                console.log(`添加玩家成功: roomId=${room.id}, hostId=${userId}, targetUserId=${targetUserId}`);
            } catch (error) {
                console.error('更新房間信息錯誤:', error);
                gameRoomManager.leaveRoom(targetUserId);

                await interaction.reply({
                    content: `添加 ${targetUser.username} 到房間失敗。`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('處理添加玩家模態框時發生錯誤:', error);
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

const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager');

module.exports = new Component({
    customId: 'mp_back',
    type: 'button',
    run: async (client, interaction) => {
        try {
            console.log('處理多人遊戲返回按鈕');
            const userId = interaction.user.id;

            // 檢查玩家是否在房間中
            const room = gameRoomManager.getPlayerRoom(userId);
            if (!room) {
                // 如果玩家不在任何房間中，顯示錯誤消息
                await interaction.reply({
                    content: '你不在任何房間中。',
                    ephemeral: true
                });
                return;
            }

            // 獲取房間信息
            const playerList = room.players.map((id, index) => {
                const name = room.playerNames[id];
                return `${index + 1}. ${name}${id === room.hostId ? ' (房主)' : ''}`;
            }).join('\n');

            // 創建房間嵌入消息
            const roomEmbed = new EmbedBuilder()
                .setTitle('🎮 多人印加寶藏遊戲房間')
                .setDescription(`房間ID: \`${room.id}\`\n\n等待其他玩家加入...\n\n點擊下方的「加入房間」按鈕加入此房間，或使用 \`/multiplayer join room_id:${room.id}\` 命令。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
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
                        .setEmoji('🎮')
                        .setDisabled(userId !== room.hostId), // 只有房主可以開始遊戲
                    new ButtonBuilder()
                        .setCustomId(`join_room_${room.id}`)
                        .setLabel('加入房間')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕'),
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

            // 更新消息
            await interaction.update({ embeds: [roomEmbed], components: [row] });
            console.log(`返回房間成功: roomId=${room.id}, userId=${userId}`);
        } catch (error) {
            console.error('處理多人遊戲返回按鈕時發生錯誤:', error);
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

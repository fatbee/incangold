const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');
const gameRoomManager = require('../../utils/GameRoomManager');

console.log('Loading new_game_room.js component');

module.exports = new Component({
    customId: 'new_game_',
    type: 'button',
    // 使用 startsWith 而不是完全匹配，這樣可以處理帶有房間 ID 的 customId
    useStartsWith: true,
    run: async (client, interaction) => {
        console.log('執行遊戲結束後的新遊戲按鈕組件');
        try {
            // 獲取房間ID（從按鈕ID中提取）
            const customId = interaction.customId;
            console.log(`按鈕ID: ${customId}`);

            const parts = customId.split('_');
            console.log(`按鈕ID分割: ${parts.join(', ')}`);

            // 正確提取房間ID
            // 格式: new_game_room_1746765077408_335
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
            const userName = interaction.user.username;
            const userAvatar = interaction.user.displayAvatarURL();

            // 檢查玩家是否已經在其他房間中
            const existingRoom = gameRoomManager.getPlayerRoom(userId);
            if (existingRoom && existingRoom.id !== roomId) {
                try {
                    await interaction.reply({
                        content: `你已經在房間 \`${existingRoom.id}\` 中，請先離開當前房間。\n\n要離開房間，你可以使用 \`/multiplayer leave\` 指令。`,
                        ephemeral: true
                    });
                    return;
                } catch (replyError) {
                    console.error('回覆錯誤:', replyError);
                    return;
                }
            }

            // 創建新房間
            const newRoomId = gameRoomManager.createRoom(userId);
            const room = gameRoomManager.getRoom(newRoomId);

            // 設置玩家名稱和頭像
            room.playerNames[userId] = userName;
            room.playerAvatars[userId] = userAvatar;

            // 創建房間信息嵌入消息
            const roomEmbed = new EmbedBuilder()
                .setTitle('🎮 多人印加寶藏遊戲房間')
                .setDescription(`房間ID: \`${newRoomId}\`\n\n等待其他玩家加入...\n\n使用 \`/multiplayer join room_id:${newRoomId}\` 加入此房間。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
                .setColor('#0099ff')
                .addFields(
                    { name: '房主', value: userName, inline: true },
                    { name: '玩家數量', value: '1', inline: true },
                    { name: '狀態', value: '等待中', inline: true },
                    { name: '玩家列表', value: `1. ${userName} (房主)` }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 創建按鈕
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`start_game_${newRoomId}`)
                        .setLabel('開始遊戲')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎮'),
                    new ButtonBuilder()
                        .setCustomId(`join_room_${newRoomId}`)
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

            try {
                const message = await interaction.reply({
                    embeds: [roomEmbed],
                    components: [row],
                    fetchReply: true
                });

                // 保存消息ID和頻道ID
                room.messageId = message.id;
                room.channelId = interaction.channelId;

                console.log(`創建新房間成功: roomId=${newRoomId}, userId=${userId}, messageId=${message.id}`);
            } catch (replyError) {
                console.error('回覆錯誤:', replyError);
                gameRoomManager.disbandRoom(newRoomId);
            }
        } catch (error) {
            console.error('執行遊戲結束後的新遊戲按鈕時發生錯誤:', error);
            try {
                await interaction.reply({
                    content: '執行新遊戲按鈕時發生錯誤，請稍後再試。',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('無法回覆錯誤消息:', replyError);
            }
        }
    }
}).toJSON();

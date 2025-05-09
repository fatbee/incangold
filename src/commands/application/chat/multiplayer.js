const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const messageManager = require('../../../utils/MessageManager');
const { getImageAttachment } = require('../../../utils/configManager');
const configManager = require('../../../utils/configManager');
const gameRoomManager = require('../../../utils/GameRoomManager');
const timerManager = require('../../../utils/TimerManager');
const { createGameActionButtons, createNextRoundButtons } = require('../../../utils/ButtonComponents');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('multiplayer')
        .setDescription('多人印加寶藏遊戲')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('創建一個新的多人遊戲房間'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('加入一個現有的多人遊戲房間')
                .addStringOption(option =>
                    option
                        .setName('room_id')
                        .setDescription('房間ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('離開當前的多人遊戲房間'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('開始多人遊戲 (僅房主可用)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('列出所有可用的遊戲房間'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('將玩家添加到你的房間中 (僅房主可用)')
                .addUserOption(option =>
                    option
                        .setName('player')
                        .setDescription('要添加的玩家')
                        .setRequired(true))),
    run: async (client, interaction) => {
        try {
            const subcommand = interaction.options.getSubcommand();
            console.log(`處理多人遊戲子命令: ${subcommand}`);

            if (subcommand === 'create') {
                // 創建新的遊戲房間
                const userId = interaction.user.id;
                const userName = interaction.user.username;
                const userAvatar = interaction.user.displayAvatarURL();

                // 檢查玩家是否已經在房間中
                const existingRoom = gameRoomManager.getPlayerRoom(userId);
                if (existingRoom) {
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
                const roomId = gameRoomManager.createRoom(userId);
                const room = gameRoomManager.getRoom(roomId);

                // 設置玩家名稱和頭像
                room.playerNames[userId] = userName;
                room.playerAvatars[userId] = userAvatar;

                // 創建房間信息嵌入消息
                const roomEmbed = new EmbedBuilder()
                    .setTitle('🎮 多人印加寶藏遊戲房間')
                    .setDescription(`房間ID: \`${roomId}\`\n\n等待其他玩家加入...\n\n使用 \`/multiplayer join room_id:${roomId}\` 加入此房間。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
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
                            .setCustomId(`start_game_${roomId}`)
                            .setLabel('開始遊戲')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎮'),
                        new ButtonBuilder()
                            .setCustomId(`join_room_${roomId}`)
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

                    console.log(`創建房間成功: roomId=${roomId}, userId=${userId}, messageId=${message.id}`);
                } catch (replyError) {
                    console.error('回覆錯誤:', replyError);
                    gameRoomManager.disbandRoom(roomId);
                }
            } else if (subcommand === 'join') {
                // 加入現有的遊戲房間
                const userId = interaction.user.id;
                const userName = interaction.user.username;
                const userAvatar = interaction.user.displayAvatarURL();
                const roomId = interaction.options.getString('room_id');

                // 檢查玩家是否已經在房間中
                const existingRoom = gameRoomManager.getPlayerRoom(userId);
                if (existingRoom) {
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

                // 檢查房間是否存在
                const room = gameRoomManager.getRoom(roomId);
                if (!room) {
                    try {
                        await interaction.reply({
                            content: `房間 \`${roomId}\` 不存在。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查房間狀態
                if (room.status !== 'waiting') {
                    try {
                        await interaction.reply({
                            content: `房間 \`${roomId}\` 已經開始遊戲，無法加入。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 加入房間
                const success = gameRoomManager.joinRoom(roomId, userId, userName, userAvatar);
                if (!success) {
                    try {
                        await interaction.reply({
                            content: `加入房間 \`${roomId}\` 失敗。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 更新房間信息
                const playerList = room.players.map((id, index) => {
                    const name = room.playerNames[id];
                    return `${index + 1}. ${name}${id === room.hostId ? ' (房主)' : ''}`;
                }).join('\n');

                const roomEmbed = new EmbedBuilder()
                    .setTitle('🎮 多人印加寶藏遊戲房間')
                    .setDescription(`房間ID: \`${roomId}\`\n\n等待其他玩家加入...\n\n點擊下方的「加入房間」按鈕加入此房間，或使用 \`/multiplayer join room_id:${roomId}\` 命令。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
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
                            .setCustomId(`start_game_${roomId}`)
                            .setLabel('開始遊戲')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎮')
                            .setDisabled(userId !== room.hostId), // 只有房主可以開始遊戲
                        new ButtonBuilder()
                            .setCustomId(`join_room_${roomId}`)
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
                    // 更新原始消息
                    const channel = await client.channels.fetch(room.channelId);
                    const message = await channel.messages.fetch(room.messageId);
                    await message.edit({ embeds: [roomEmbed], components: [row] });

                    // 回覆玩家
                    await interaction.reply({
                        content: `成功加入房間 \`${roomId}\`。`,
                        ephemeral: true
                    });

                    console.log(`加入房間成功: roomId=${roomId}, userId=${userId}`);
                } catch (error) {
                    console.error('更新房間信息錯誤:', error);
                    gameRoomManager.leaveRoom(userId);

                    try {
                        await interaction.reply({
                            content: `加入房間 \`${roomId}\` 失敗。`,
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                    }
                }
            } else if (subcommand === 'leave') {
                // 離開當前的遊戲房間
                const userId = interaction.user.id;

                // 檢查玩家是否在房間中
                const room = gameRoomManager.getPlayerRoom(userId);
                if (!room) {
                    try {
                        await interaction.reply({
                            content: '你不在任何房間中。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                const roomId = room.id;
                const isHost = room.hostId === userId;

                // 離開房間
                const success = gameRoomManager.leaveRoom(userId);
                if (!success) {
                    try {
                        await interaction.reply({
                            content: `離開房間 \`${roomId}\` 失敗。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                try {
                    await interaction.reply({
                        content: `成功離開房間 \`${roomId}\`。`,
                        ephemeral: true
                    });

                    console.log(`離開房間成功: roomId=${roomId}, userId=${userId}, isHost=${isHost}`);

                    // 如果是房主離開，房間已經被解散
                    if (isHost) {
                        try {
                            // 更新原始消息
                            const channel = await client.channels.fetch(room.channelId);
                            const message = await channel.messages.fetch(room.messageId);

                            const disbandEmbed = new EmbedBuilder()
                                .setTitle('🎮 多人印加寶藏遊戲房間')
                                .setDescription(`房間 \`${roomId}\` 已被解散。`)
                                .setColor('#ff0000')
                                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                            await message.edit({ embeds: [disbandEmbed], components: [] });
                        } catch (error) {
                            console.error('更新房間信息錯誤:', error);
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
                                .setDescription(`房間ID: \`${roomId}\`\n\n等待其他玩家加入...\n\n點擊下方的「加入房間」按鈕加入此房間，或使用 \`/multiplayer join room_id:${roomId}\` 命令。\n使用 \`/multiplayer leave\` 離開此房間。\n使用 \`/multiplayer add @玩家\` 命令來添加玩家到房間。`)
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
                                        .setCustomId(`join_room_${roomId}`)
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
                                // 更新原始消息
                                const channel = await client.channels.fetch(room.channelId);
                                const message = await channel.messages.fetch(room.messageId);
                                await message.edit({ embeds: [roomEmbed], components: [row] });
                            } catch (error) {
                                console.error('更新房間信息錯誤:', error);
                            }
                        }
                    }
                } catch (replyError) {
                    console.error('回覆錯誤:', replyError);
                }
            } else if (subcommand === 'start') {
                // 開始多人遊戲
                const userId = interaction.user.id;

                // 檢查玩家是否在房間中
                const room = gameRoomManager.getPlayerRoom(userId);
                if (!room) {
                    try {
                        await interaction.reply({
                            content: '你不在任何房間中。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查是否是房主
                if (room.hostId !== userId) {
                    try {
                        await interaction.reply({
                            content: '只有房主可以開始遊戲。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查玩家數量
                if (room.players.length < 2) {
                    try {
                        await interaction.reply({
                            content: '至少需要2名玩家才能開始遊戲。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 開始遊戲
                const success = gameRoomManager.startGame(room.id);
                if (!success) {
                    try {
                        await interaction.reply({
                            content: '開始遊戲失敗。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                try {
                    await interaction.reply({
                        content: '遊戲開始！',
                        ephemeral: true
                    });

                    console.log(`開始遊戲成功: roomId=${room.id}, userId=${userId}`);

                    // 直接創建第一回合的嵌入消息
                    const roundEmbed = new EmbedBuilder()
                        .setTitle(`🎮 多人印加寶藏遊戲 - 第${room.gameState.currentRound}回合`)
                        .setDescription('新的回合開始了！請選擇你的行動。\n\n你有20秒的時間做出選擇，或者等待所有玩家都做出選擇。')
                        .setColor('#0099ff')
                        .addFields(
                            { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                            { name: '行動次數', value: `${room.gameState.actionsInRound}`, inline: true },
                            { name: '⏱️ 倒數計時', value: '20 秒', inline: false }
                        )
                        .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                    // 添加玩家信息
                    for (const playerId of room.players) {
                        const playerName = room.playerNames[playerId];
                        const playerGold = room.gameState.playerGold[playerId];

                        roundEmbed.addFields({
                            name: playerName,
                            value: `當前金幣: ${playerGold}\n行動: 等待中...`,
                            inline: true
                        });
                    }

                    // 使用共用組件創建按鈕
                    const row = createGameActionButtons(room.id);

                    // 更新原始消息
                    const channel = await client.channels.fetch(room.channelId);
                    const message = await channel.messages.fetch(room.messageId);
                    await message.edit({ embeds: [roundEmbed], components: [row] });

                    console.log(`第一回合開始成功: roomId=${room.id}`);
                } catch (error) {
                    console.error('開始遊戲時發生錯誤:', error);
                    try {
                        await interaction.followUp({
                            content: '開始遊戲時發生錯誤，請稍後再試。',
                            ephemeral: true
                        });
                    } catch (followUpError) {
                        console.error('回覆錯誤:', followUpError);
                    }
                }
            } else if (subcommand === 'list') {
                // 列出所有可用的遊戲房間
                const waitingRooms = gameRoomManager.getAllWaitingRooms();

                if (waitingRooms.length === 0) {
                    try {
                        await interaction.reply({
                            content: '目前沒有可用的遊戲房間。\n\n你可以使用 `/multiplayer create` 創建一個新的房間。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 創建房間列表嵌入消息
                const roomListEmbed = new EmbedBuilder()
                    .setTitle('🎮 多人印加寶藏遊戲房間列表')
                    .setDescription('以下是所有可用的遊戲房間：')
                    .setColor('#0099ff')
                    .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                // 添加每個房間的信息
                for (const room of waitingRooms) {
                    roomListEmbed.addFields({
                        name: `房間ID: ${room.id}`,
                        value: `房主: ${room.playerNames[room.hostId]}\n玩家數量: ${room.players.length}\n狀態: 等待中\n\n點擊房間消息上的「加入房間」按鈕加入此房間，或使用 \`/multiplayer join room_id:${room.id}\` 命令。`,
                        inline: false
                    });
                }

                // 創建按鈕
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`new_game`)
                            .setLabel('創建新房間')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎮'),
                        new ButtonBuilder()
                            .setCustomId(`mp_rules`)
                            .setLabel('遊戲規則')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('📜')
                    );

                try {
                    await interaction.reply({
                        embeds: [roomListEmbed],
                        components: [row],
                        ephemeral: true
                    });

                    console.log(`列出房間成功: 共${waitingRooms.length}個房間`);
                } catch (replyError) {
                    console.error('回覆錯誤:', replyError);
                }
            } else if (subcommand === 'add') {
                // 將玩家添加到房間中 (僅房主可用)
                const userId = interaction.user.id;
                const targetUser = interaction.options.getUser('player');
                const targetUserId = targetUser.id;

                // 檢查目標玩家是否是自己
                if (targetUserId === userId) {
                    try {
                        await interaction.reply({
                            content: '你不能添加自己到房間中。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查玩家是否在房間中
                const room = gameRoomManager.getPlayerRoom(userId);
                if (!room) {
                    try {
                        await interaction.reply({
                            content: '你不在任何房間中。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查是否是房主
                if (room.hostId !== userId) {
                    try {
                        await interaction.reply({
                            content: '只有房主可以添加玩家到房間中。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查房間狀態
                if (room.status !== 'waiting') {
                    try {
                        await interaction.reply({
                            content: '遊戲已經開始，無法添加玩家。',
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查目標玩家是否已經在房間中
                if (room.players.includes(targetUserId)) {
                    try {
                        await interaction.reply({
                            content: `${targetUser.username} 已經在房間中。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 檢查目標玩家是否已經在其他房間中
                const targetUserRoom = gameRoomManager.getPlayerRoom(targetUserId);
                if (targetUserRoom) {
                    try {
                        await interaction.reply({
                            content: `${targetUser.username} 已經在另一個房間中。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 添加玩家到房間
                const success = gameRoomManager.joinRoom(
                    room.id,
                    targetUserId,
                    targetUser.username,
                    targetUser.displayAvatarURL()
                );

                if (!success) {
                    try {
                        await interaction.reply({
                            content: `添加 ${targetUser.username} 到房間失敗。`,
                            ephemeral: true
                        });
                        return;
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                        return;
                    }
                }

                // 更新房間信息
                const playerList = room.players.map((id, index) => {
                    const name = room.playerNames[id];
                    return `${index + 1}. ${name}${id === room.hostId ? ' (房主)' : ''}`;
                }).join('\n');

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
                            .setEmoji('🎮'),
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

                    try {
                        await interaction.reply({
                            content: `添加 ${targetUser.username} 到房間失敗。`,
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('回覆錯誤:', replyError);
                    }
                }
            }
        } catch (error) {
            console.error('執行多人遊戲命令時發生錯誤:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '執行命令時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '執行命令時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('回覆錯誤:', replyError);
            }
        }
    }
}).toJSON();

// 導出函數供其他模塊使用
module.exports.processRoundResult = processRoundResult;
module.exports.startNewRound = startNewRound;
module.exports.updateGameMessage = updateGameMessage;

/**
 * 更新遊戲消息
 * @param {Object} client - Discord客戶端
 * @param {Object} room - 房間對象
 */
async function updateGameMessage(client, room) {
    try {
        // 獲取頻道和消息
        const channel = await client.channels.fetch(room.channelId);
        const message = await channel.messages.fetch(room.messageId);

        // 檢查是否遇到危險或寶藏
        const hasDanger = room.gameState.lastOutcome && room.gameState.lastOutcome.type === 'danger';
        const hasTreasure = room.gameState.lastOutcome && room.gameState.lastOutcome.type === 'treasure';

        // 創建嵌入消息
        const embed = new EmbedBuilder()
            .setTitle(`🎮 多人印加寶藏遊戲 - 第${room.gameState.currentRound}回合`)
            .setDescription('請選擇你的行動。\n\n你有20秒的時間做出選擇，或者等待所有玩家都做出選擇。')
            .setColor(hasDanger ? '#ff0000' : hasTreasure ? '#FFD700' : '#0099ff') // 如果遇到危險，使用紅色；如果遇到寶藏，使用金色；否則使用藍色
            .addFields(
                { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                { name: '行動次數', value: `${room.gameState.actionsInRound}/30`, inline: true },
                { name: '⏱️ 倒數計時', value: '20 秒', inline: false }
            )
            .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

        // 添加玩家信息
        for (const playerId of room.players) {
            const playerName = room.playerNames[playerId];
            const playerGold = room.gameState.playerGold[playerId] || 0;
            const playerAction = room.gameState.playerActions[playerId];

            let actionText = '等待中...';

            // 檢查玩家是否已返回營地（在之前的行動中）
            // 我們需要檢查玩家的行動狀態來判斷
            // 如果玩家在當前回合中已經返回營地，則 playerReturned 會被設置為 true
            const playerReturned = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;

            // 檢查是否有最後一次行動結果，如果有，則顯示玩家的實際選擇
            const hasLastOutcome = room.gameState.lastOutcome !== null;

            // 檢查是否所有玩家都已做出選擇
            const allPlayersActed = room.players.every(pid =>
                room.gameState.playerActions[pid] !== null ||
                (room.gameState.playerReturned && room.gameState.playerReturned[pid])
            );

            if (playerAction === 'continue') {
                actionText = (hasLastOutcome || allPlayersActed) ? '繼續探索' : '已選擇';
            } else if (playerAction === 'return') {
                actionText = (hasLastOutcome || allPlayersActed) ? '返回營地' : '已選擇';
            } else if (playerReturned) {
                // 如果玩家已返回營地但當前沒有行動（在新的行動中），顯示"已返回營地"
                actionText = '已返回營地';
            }

            embed.addFields({
                name: playerName,
                value: `當前金幣: ${playerGold}\n行動: ${actionText}`,
                inline: true
            });
        }

        // 添加最後一次行動的結果
        if (room.gameState.lastOutcome) {
            const outcome = room.gameState.lastOutcome;
            if (outcome.type === 'gold') {
                embed.addFields({
                    name: '💰 發現金幣！',
                    value: `發現了 ${outcome.value} 金幣，每位繼續探索的玩家獲得 ${outcome.goldPerPlayer} 金幣。`,
                    inline: false
                });
            } else if (outcome.type === 'danger') {
                const dangerTypeMap = configManager.getDangerTypeMap();
                const dangerName = dangerTypeMap[outcome.value] || outcome.value;

                if (outcome.isDuplicate) {
                    embed.addFields({
                        name: '⚠️ 危險！',
                        value: `遇到了第二次 ${dangerName}！所有繼續探索的玩家失去了所有未保存的金幣，且本回合不會獲得任何金幣。`,
                        inline: false
                    });
                } else {
                    embed.addFields({
                        name: '⚠️ 危險！',
                        value: `遇到了 ${dangerName}！小心，如果再次遇到相同的危險，所有繼續探索的玩家將失去所有未保存的金幣，且本回合不會獲得任何金幣。`,
                        inline: false
                    });
                }
            } else if (outcome.type === 'treasure') {
                let treasureMessage = `💎 發現了價值 ${outcome.value} 金幣的寶藏！`;

                if (outcome.luckyPlayer) {
                    // 有玩家獲得寶藏
                    const luckyPlayerName = room.playerNames[outcome.luckyPlayer];
                    treasureMessage += `\n${luckyPlayerName} 是唯一一個返回營地的玩家，獲得了寶藏！`;
                } else {
                    // 寶藏保留在場上
                    treasureMessage += `\n沒有唯一一個返回營地的玩家，寶藏保留在場上，等待下一個唯一返回的玩家獲得。`;
                }

                embed.addFields({
                    name: '💎 發現寶藏！',
                    value: treasureMessage,
                    inline: false
                });
            }
        }

        // 添加事件記錄
        if (room.gameState.eventLog && room.gameState.eventLog.length > 0) {
            // 格式化事件記錄
            const formattedEvents = room.gameState.eventLog.map(event => {
                if (event.startsWith('gold_')) {
                    const goldValue = event.split('_')[1];
                    return `金幣 ${goldValue}`;
                } else if (event.startsWith('danger_')) {
                    const dangerType = event.split('_')[1];
                    const dangerTypeMap = configManager.getDangerTypeMap();
                    return dangerTypeMap[dangerType] || dangerType;
                } else if (event.startsWith('treasure_')) {
                    const treasureValue = event.split('_')[1];
                    return `寶藏 ${treasureValue}`;
                }
                return event;
            });

            embed.addFields({
                name: '📜 事件記錄',
                value: formattedEvents.join(', '),
                inline: false
            });
        }

        // 使用共用組件創建按鈕
        const row = createGameActionButtons(room.id);

        // 更新消息
        await message.edit({ embeds: [embed], components: [row] });
        return true;
    } catch (error) {
        console.error(`更新遊戲消息時發生錯誤: roomId=${room.id}`, error);
        return false;
    }
}

/**
 * 處理回合結果
 * @param {Object} client - Discord客戶端
 * @param {Object} room - 房間對象
 */
async function processRoundResult(client, room) {
    try {
        // 處理回合結果
        const result = gameRoomManager.processRoundResult(room.id);
        if (!result) {
            console.error(`處理回合結果失敗: roomId=${room.id}`);
            return;
        }

        // 檢查是否有重複危險
        const isDuplicateDanger = room.gameState.lastOutcome &&
                                 room.gameState.lastOutcome.type === 'danger' &&
                                 room.gameState.lastOutcome.isDuplicate;

        // 如果有重複危險，確保結果類型為 'danger'
        if (isDuplicateDanger && result.type !== 'danger') {
            console.log(`修正結果類型: 從 ${result.type} 改為 danger，因為遇到了重複危險`);
            result.type = 'danger';
            result.value = room.gameState.lastOutcome.value;
            result.isDuplicate = true;
        }

        // 獲取頻道和消息
        const channel = await client.channels.fetch(room.channelId);
        const message = await channel.messages.fetch(room.messageId);

        // 創建結果嵌入消息
        let resultEmbed;

        if (result.type === 'all_returned') {
            // 所有玩家都返回營地
            resultEmbed = new EmbedBuilder()
                .setTitle(`🏕️ 多人印加寶藏遊戲 - 所有玩家返回營地`)
                .setDescription('所有玩家都選擇返回營地，本回合結束。')
                .setColor('#00ff00')
                .addFields(
                    { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 添加玩家信息
            for (const playerId of room.players) {
                const playerName = room.playerNames[playerId];
                const playerGold = room.gameState.playerGold[playerId];

                resultEmbed.addFields({
                    name: playerName,
                    value: `當前金幣: ${playerGold}\n行動: 返回營地`,
                    inline: true
                });
            }
        } else if (result.type === 'gold') {
            // 發現金幣
            resultEmbed = new EmbedBuilder()
                .setTitle(`💰 多人印加寶藏遊戲 - 發現金幣！`)
                .setDescription(`發現了 ${result.value} 金幣！每位繼續探索的玩家獲得 ${result.goldPerPlayer} 金幣。`)
                .setColor('#ffd700')
                .addFields(
                    { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                    { name: '行動次數', value: `${room.gameState.actionsInRound + 1}`, inline: true }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 添加玩家信息
            for (const playerId of room.players) {
                const playerName = room.playerNames[playerId];
                const playerGold = room.gameState.playerGold[playerId];
                const playerAction = result.continuingPlayers.includes(playerId) ? '繼續探索' : '返回營地';

                resultEmbed.addFields({
                    name: playerName,
                    value: `當前金幣: ${playerGold}\n行動: ${playerAction}`,
                    inline: true
                });
            }
        } else if (result.type === 'treasure') {
            // 發現寶藏
            let description = `發現了價值 ${result.value} 金幣的寶藏！`;

            if (result.luckyPlayer) {
                // 有玩家獲得寶藏
                const luckyPlayerName = room.playerNames[result.luckyPlayer];
                description += `\n${luckyPlayerName} 是唯一一個返回營地的玩家，獲得了寶藏！`;
            } else {
                // 寶藏保留在場上
                description += `\n沒有唯一一個返回營地的玩家，寶藏保留在場上，等待下一個唯一返回的玩家獲得。`;
            }

            resultEmbed = new EmbedBuilder()
                .setTitle(`💎 多人印加寶藏遊戲 - 發現寶藏！`)
                .setDescription(description)
                .setColor('#FFD700') // 金色/黃色
                .addFields(
                    { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                    { name: '行動次數', value: `${room.gameState.actionsInRound + 1}`, inline: true }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 添加玩家信息
            for (const playerId of room.players) {
                const playerName = room.playerNames[playerId];
                const playerGold = room.gameState.playerGold[playerId];
                let playerAction = '';

                if (playerId === result.luckyPlayer) {
                    playerAction = '返回營地 (獲得寶藏)';
                } else if (result.returningPlayers && result.returningPlayers.includes(playerId)) {
                    playerAction = '返回營地';
                } else {
                    playerAction = '繼續探索';
                }

                resultEmbed.addFields({
                    name: playerName,
                    value: `當前金幣: ${playerGold}\n行動: ${playerAction}`,
                    inline: true
                });
            }
        } else if (result.type === 'danger') {
            // 遇到危險
            const dangerTranslations = configManager.getDangerTypeMap();

            const dangerName = dangerTranslations[result.value] || result.value;

            resultEmbed = new EmbedBuilder()
                .setTitle(`⚠️ 多人印加寶藏遊戲 - 遇到危險！`)
                .setDescription(`遇到了${dangerName}！${result.isDuplicate ? '這是第二次遇到相同的危險，所有繼續探索的玩家失去了所有未保存的金幣，且本回合不會獲得任何金幣！' : ''}`)
                .setColor('#ff0000')
                .addFields(
                    { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                    { name: '行動次數', value: `${room.gameState.actionsInRound + 1}`, inline: true }
                )
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 添加玩家信息
            for (const playerId of room.players) {
                const playerName = room.playerNames[playerId];
                const playerGold = room.gameState.playerGold[playerId];
                // 如果是重複危險，將繼續探索的玩家顯示為"死亡"
                let playerAction;
                if (result.isDuplicate && result.continuingPlayers.includes(playerId)) {
                    playerAction = '💀 死亡';
                } else {
                    playerAction = result.continuingPlayers.includes(playerId) ? '繼續探索' : '返回營地';
                }

                resultEmbed.addFields({
                    name: playerName,
                    value: `當前金幣: ${playerGold}\n行動: ${playerAction}`,
                    inline: true
                });
            }

            // 添加事件記錄
            if (room.gameState.eventLog && room.gameState.eventLog.length > 0) {
                // 格式化事件記錄
                const formattedEvents = room.gameState.eventLog.map(event => {
                    if (event.startsWith('gold_')) {
                        const goldValue = event.split('_')[1];
                        return `金${goldValue}`;
                    } else if (event.startsWith('danger_')) {
                        const dangerType = event.split('_')[1];
                        const dangerTypeMap = configManager.getDangerTypeMap();
                        return dangerTypeMap[dangerType] || dangerType;
                    }
                    return event;
                });

                resultEmbed.addFields({
                    name: '📜 事件記錄',
                    value: formattedEvents.join(', '),
                    inline: false
                });
            }
        }

        // 檢查遊戲是否結束
        if (result.isGameOver) {
            // 遊戲結束，顯示最終結果
            const finalEmbed = new EmbedBuilder()
                .setTitle(`🏆 多人印加寶藏遊戲 - 遊戲結束！`)
                .setDescription('遊戲結束！以下是最終結果：')
                .setColor('#9932cc')
                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

            // 計算最終排名
            const playerRanking = room.players.map(playerId => ({
                id: playerId,
                name: room.playerNames[playerId],
                gold: room.gameState.playerSecuredGold[playerId]
            })).sort((a, b) => b.gold - a.gold);

            // 添加排名信息
            for (let i = 0; i < playerRanking.length; i++) {
                const player = playerRanking[i];
                finalEmbed.addFields({
                    name: `第${i + 1}名: ${player.name}`,
                    value: `總金幣: ${player.gold}`,
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

            // 更新消息
            await message.edit({ embeds: [finalEmbed], components: [row] });

            // 解散房間
            gameRoomManager.disbandRoom(room.id);
        } else {
            // 遊戲未結束，顯示結果並準備下一回合
            // 使用共用組件創建下一回合按鈕
            const row = createNextRoundButtons(room.id);

            // 更新消息
            await message.edit({ embeds: [resultEmbed], components: [row] });

            // 如果是重複危險或所有玩家都返回營地，自動進入下一回合
            if (result.nextRound) {
                // 等待2秒後自動進入下一回合
                setTimeout(() => {
                    startNewRound(client, room);
                }, 2000);
            }
        }
    } catch (error) {
        console.error('處理回合結果時發生錯誤:', error);
    }
}

/**
 * 初始化回合卡牌組
 * @param {Object} room - 房間對象
 */
function initializeRoundDeck(room) {
    console.log(`初始化回合卡牌組: roomId=${room.id}`);

    // 清空卡牌組
    room.gameState.roundDeck = [];

    // 添加寶藏卡（從未使用的寶藏卡中隨機選擇一張）
    const availableTreasures = room.gameState.treasureCards.filter(
        value => !room.gameState.usedTreasures.includes(value)
    );

    if (availableTreasures.length > 0) {
        // 隨機選擇一張寶藏卡
        const treasureIndex = Math.floor(Math.random() * availableTreasures.length);
        const treasureValue = availableTreasures[treasureIndex];

        // 添加到卡牌組
        room.gameState.roundDeck.push({
            type: 'treasure',
            value: treasureValue
        });

        // 添加到已使用的寶藏卡
        room.gameState.usedTreasures.push(treasureValue);

        console.log(`添加寶藏卡: roomId=${room.id}, treasureValue=${treasureValue}`);
    } else {
        console.log(`沒有可用的寶藏卡: roomId=${room.id}`);
    }

    // 添加危險卡（每種危險3張，共5種危險，總共15張）
    const dangerTypes = ['snake', 'spider', 'mummy', 'fire', 'rockfall'];
    for (const dangerType of dangerTypes) {
        for (let i = 0; i < 3; i++) {
            room.gameState.roundDeck.push({
                type: 'danger',
                value: dangerType
            });
        }
    }
    console.log(`添加危險卡: roomId=${room.id}, count=15`);

    // 添加金幣卡（剩餘的卡牌，總共30張卡）
    const goldValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
    const remainingCards = 30 - room.gameState.roundDeck.length;

    for (let i = 0; i < remainingCards; i++) {
        const goldValue = goldValues[Math.floor(Math.random() * goldValues.length)];
        room.gameState.roundDeck.push({
            type: 'gold',
            value: goldValue
        });
    }
    console.log(`添加金幣卡: roomId=${room.id}, count=${remainingCards}`);

    // 洗牌
    for (let i = room.gameState.roundDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.gameState.roundDeck[i], room.gameState.roundDeck[j]] = [room.gameState.roundDeck[j], room.gameState.roundDeck[i]];
    }

    console.log(`回合卡牌組初始化完成: roomId=${room.id}, deckSize=${room.gameState.roundDeck.length}`);
}

/**
 * 開始新回合
 * @param {Object} client - Discord客戶端
 * @param {Object} room - 房間對象
 */
async function startNewRound(client, room) {
    console.log(`開始新回合: roomId=${room.id}, currentRound=${room.gameState.currentRound}`);
    try {
        // 檢查房間是否有效
        if (!room || !room.id) {
            console.error('無效的房間對象:', room);
            return;
        }

        // 檢查房間狀態
        if (room.status !== 'playing') {
            console.error(`房間狀態不是 'playing': roomId=${room.id}, status=${room.status}`);
            return;
        }

        // 檢查遊戲是否結束
        if (room.gameState.currentRound > room.gameState.maxRounds) {
            console.log(`遊戲結束，顯示最終結果: roomId=${room.id}, currentRound=${room.gameState.currentRound}, maxRounds=${room.gameState.maxRounds}`);
            await endGame(client, room);
            return;
        }

        // 更新房間狀態
        room.gameState.actionsInRound = 0;
        room.gameState.gold = 0;
        room.gameState.dangersEncountered = [];
        room.gameState.eventLog = [];
        room.gameState.lastOutcome = null; // 清除最後一次行動結果，確保不顯示玩家的實際選擇
        room.gameState.playerReturned = {}; // 重置玩家返回營地的標記
        room.gameState.treasureInPlay = false; // 重置寶藏卡狀態
        room.gameState.treasureValue = 0;

        // 初始化回合卡牌組
        initializeRoundDeck(room);

        console.log(`房間狀態已更新: roomId=${room.id}`);

        // 重置所有玩家的行動
        for (const playerId of room.players) {
            room.gameState.playerActions[playerId] = null;
        }
        console.log(`玩家行動已重置: roomId=${room.id}, playerCount=${room.players.length}`);

        // 創建回合開始嵌入消息
        const roundEmbed = new EmbedBuilder()
            .setTitle(`🎮 多人印加寶藏遊戲 - 第${room.gameState.currentRound}回合`)
            .setDescription('新的回合開始了！請選擇你的行動。\n\n你有20秒的時間做出選擇，或者等待所有玩家都做出選擇。')
            .setColor('#0099ff') // 新回合始終使用藍色
            .addFields(
                { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                { name: '行動次數', value: `${room.gameState.actionsInRound}/30`, inline: true },
                { name: '⏱️ 倒數計時', value: '20 秒', inline: false }
            )
            .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });
        console.log(`回合嵌入消息已創建: roomId=${room.id}`);

        // 添加玩家信息
        for (const playerId of room.players) {
            const playerName = room.playerNames[playerId];
            const playerGold = room.gameState.playerGold[playerId];

            roundEmbed.addFields({
                name: playerName,
                value: `當前金幣: ${playerGold}\n行動: 等待中...`,
                inline: true
            });
        }
        console.log(`玩家信息已添加到嵌入消息: roomId=${room.id}`);

        // 使用共用組件創建按鈕
        const row = createGameActionButtons(room.id);
        console.log(`按鈕已創建: roomId=${room.id}`);

        try {
            // 檢查頻道和消息ID是否有效
            if (!room.channelId || !room.messageId) {
                console.error(`無效的頻道ID或消息ID: roomId=${room.id}, channelId=${room.channelId}, messageId=${room.messageId}`);
                return;
            }

            // 更新原始消息
            console.log(`嘗試獲取頻道: roomId=${room.id}, channelId=${room.channelId}`);
            const channel = await client.channels.fetch(room.channelId);
            if (!channel) {
                console.error(`無法獲取頻道: roomId=${room.id}, channelId=${room.channelId}`);
                return;
            }

            console.log(`嘗試獲取消息: roomId=${room.id}, messageId=${room.messageId}`);
            const message = await channel.messages.fetch(room.messageId);
            if (!message) {
                console.error(`無法獲取消息: roomId=${room.id}, messageId=${room.messageId}`);
                return;
            }

            console.log(`嘗試更新消息: roomId=${room.id}`);
            await message.edit({ embeds: [roundEmbed], components: [row] });
            console.log(`消息已更新: roomId=${room.id}`);

            // 保存消息引用以便將來使用
            room.gameMessage = message;

            // 設置計時器
            const timerEndTime = Date.now() + 20000; // 20秒
            room.gameState.timerEndTime = timerEndTime;
            console.log(`計時器結束時間已設置: roomId=${room.id}, endTime=${new Date(timerEndTime).toLocaleTimeString()}`);

            // 設置計時器，如果5秒內沒有所有玩家都做出選擇，自動執行下一個行動
            console.log(`嘗試設置計時器: roomId=${room.id}`);

            // 定義處理行動的函數
            const processAction = async () => {
                console.log(`處理行動: roomId=${room.id}`);
                try {
                    // 定義危險類型映射
                    const dangerTypeMap = configManager.getDangerTypeMap();
                    
                    // 為未做出選擇的玩家設置默認行動
                    let playersUpdated = false;
                    for (const playerId of room.players) {
                        // 檢查玩家是否已返回營地（在當前回合或之前的行動中）
                        const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;

                        // 跳過已經返回營地的玩家
                        if (room.gameState.playerActions[playerId] === 'return' || hasReturnedToCamp) {
                            continue;
                        }

                        if (room.gameState.playerActions[playerId] === null) {
                            room.gameState.playerActions[playerId] = 'continue'; // 默認繼續探索
                            playersUpdated = true;
                            console.log(`為玩家設置默認行動: roomId=${room.id}, playerId=${playerId}, action=continue`);
                        }
                    }

                    // 更新遊戲消息，顯示哪些玩家已經做出選擇
                    if (playersUpdated) {
                        await updateGameMessage(client, room);
                    }

                    // 增加行動次數
                    room.gameState.actionsInRound++;
                    console.log(`行動次數增加: roomId=${room.id}, actionsInRound=${room.gameState.actionsInRound}`);

                    // 檢查是否達到行動次數上限 (30次)
                    if (room.gameState.actionsInRound >= 30) {
                        console.log(`達到行動次數上限，自動結束回合: roomId=${room.id}, actionsInRound=${room.gameState.actionsInRound}`);

                        // 為所有繼續探索的玩家保存金幣
                        const continuingPlayers = room.players.filter(
                            playerId => room.gameState.playerActions[playerId] === 'continue'
                        );

                        for (const playerId of continuingPlayers) {
                            room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                            room.gameState.playerGold[playerId] = 0;
                        }

                        // 進入下一回合
                        room.gameState.currentRound++;
                        room.gameState.actionsInRound = 0;
                        room.gameState.gold = 0;
                        room.gameState.dangersEncountered = [];
                        // 不清空事件記錄，保留給結果嵌入消息使用

                        // 重置所有玩家的行動
                        for (const playerId of room.players) {
                            room.gameState.playerActions[playerId] = null;
                        }

                        // 創建結果嵌入消息
                        const resultEmbed = new EmbedBuilder()
                            .setTitle(`⏱️ 多人印加寶藏遊戲 - 行動次數上限`)
                            .setDescription(`已達到行動次數上限(30次)，本回合結束。所有玩家的金幣已保存。`)
                            .setColor('#FFA500') // 橙色
                            .addFields(
                                { name: '回合', value: `${room.gameState.currentRound-1}/${room.gameState.maxRounds}`, inline: true },
                                { name: '行動次數', value: `30`, inline: true }
                            )
                            .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                        // 添加玩家信息，顯示每個玩家的實際選擇
                        for (const playerId of room.players) {
                            const playerName = room.playerNames[playerId];
                            const playerGold = room.gameState.playerGold[playerId];
                            const playerAction = room.gameState.playerActions[playerId] === 'continue' ? '繼續探索' : '返回營地';

                            resultEmbed.addFields({
                                name: playerName,
                                value: `當前金幣: ${playerGold}\n行動: ${playerAction}`,
                                inline: true
                            });
                        }

                        // 添加事件記錄
                        if (room.gameState.eventLog && room.gameState.eventLog.length > 0) {
                            // 格式化事件記錄
                            const formattedEvents = room.gameState.eventLog.map(event => {
                                if (event.startsWith('gold_')) {
                                    const goldValue = event.split('_')[1];
                                    return `金幣 ${goldValue}`;
                                } else if (event.startsWith('danger_')) {
                                    const dangerType = event.split('_')[1];
                                    const dangerTypeMap = configManager.getDangerTypeMap();
                                    return dangerTypeMap[dangerType] || dangerType;
                                } else if (event.startsWith('treasure_')) {
                                    const treasureValue = event.split('_')[1];
                                    return `寶藏 ${treasureValue}`;
                                }
                                return event;
                            });

                            resultEmbed.addFields({
                                name: '📜 事件記錄',
                                value: formattedEvents.join(', '),
                                inline: false
                            });
                        }

                        // 使用共用組件創建下一回合按鈕
                        const row = createNextRoundButtons(room.id);

                        // 更新消息
                        await message.edit({ embeds: [resultEmbed], components: [row] });

                        // 檢查遊戲是否結束
                        if (room.gameState.currentRound > room.gameState.maxRounds) {
                            room.status = 'finished';

                            // 顯示最終結果
                            const finalEmbed = new EmbedBuilder()
                                .setTitle(`🏆 多人印加寶藏遊戲 - 遊戲結束！`)
                                .setDescription('遊戲結束！以下是最終結果：')
                                .setColor('#9932cc')
                                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                            // 計算最終排名
                            const playerRanking = room.players.map(playerId => ({
                                id: playerId,
                                name: room.playerNames[playerId],
                                gold: room.gameState.playerSecuredGold[playerId]
                            })).sort((a, b) => b.gold - a.gold);

                            // 添加排名信息
                            for (let i = 0; i < playerRanking.length; i++) {
                                const player = playerRanking[i];
                                finalEmbed.addFields({
                                    name: `第${i + 1}名: ${player.name}`,
                                    value: `總金幣: ${player.gold}`,
                                    inline: false
                                });
                            }

                            // 創建按鈕
                            const finalRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`new_game_${room.id}`)
                                        .setLabel('開始新遊戲')
                                        .setStyle(ButtonStyle.Primary)
                                        .setEmoji('🔄')
                                );

                            // 更新消息
                            await message.edit({ embeds: [finalEmbed], components: [finalRow] });

                            // 解散房間
                            gameRoomManager.disbandRoom(room.id);
                        } else {
                            // 等待2秒後自動進入下一回合
                            setTimeout(() => {
                                startNewRound(client, room);
                            }, 2000);
                        }

                        return;
                    }

                    // 從回合卡牌組中抽取下一張卡
                    let outcome;
                    let goldValue = 0;
                    let dangerType = '';
                    let treasureValue = 0;

                    // 如果回合卡牌組為空，重新初始化
                    if (room.gameState.roundDeck.length === 0) {
                        initializeRoundDeck(room);
                    }

                    // 抽取卡牌
                    const card = room.gameState.roundDeck.pop();
                    console.log(`抽取卡牌: roomId=${room.id}, card=${JSON.stringify(card)}`);

                    if (card.type === 'gold') {
                        outcome = 'gold';
                        goldValue = card.value;
                    } else if (card.type === 'danger') {
                        outcome = 'danger';
                        dangerType = card.value;
                    } else if (card.type === 'treasure') {
                        outcome = 'treasure';
                        treasureValue = card.value;
                        room.gameState.treasureInPlay = true;
                        room.gameState.treasureValue = treasureValue;
                    }

                    // 處理行動結果
                    if (outcome === 'gold') {
                        // 處理發現金幣的情況

                        // 計算每個繼續探索的玩家獲得的金幣
                        // 只考慮當前繼續探索的玩家，不包括已返回營地的玩家
                        const continuingPlayers = room.players.filter(
                            playerId => {
                                // 檢查玩家是否已返回營地（在當前回合或之前的行動中）
                                const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;
                                // 只有未返回營地且選擇繼續探索的玩家才能獲得金幣
                                return !hasReturnedToCamp && room.gameState.playerActions[playerId] === 'continue';
                            }
                        );

                        // 如果沒有繼續探索的玩家，則不分配金幣
                        const goldPerPlayer = continuingPlayers.length > 0 ? Math.floor(goldValue / continuingPlayers.length) : 0;

                        // 為每個繼續探索的玩家添加金幣
                        for (const playerId of continuingPlayers) {
                            room.gameState.playerGold[playerId] += goldPerPlayer;
                        }

                        // 記錄事件
                        room.gameState.eventLog.push(`gold_${goldValue}`);
                        room.gameState.gold += goldValue;

                        // 設置最後一次行動結果，用於顯示玩家的實際選擇
                        room.gameState.lastOutcome = {
                            type: 'gold',
                            value: goldValue,
                            goldPerPlayer,
                            timestamp: Date.now() // 添加時間戳，用於判斷是否是新的行動結果
                        };

                        console.log(`發現金幣: roomId=${room.id}, goldValue=${goldValue}, goldPerPlayer=${goldPerPlayer}`);
                    } else if (outcome === 'treasure') {
                        // 處理發現寶藏的情況
                        console.log(`發現寶藏: roomId=${room.id}, treasureValue=${treasureValue}`);

                        // 檢查是否有唯一一個返回營地的玩家
                        const returningPlayers = room.players.filter(
                            playerId => room.gameState.playerActions[playerId] === 'return'
                        );

                        if (returningPlayers.length === 1) {
                            // 只有一個玩家返回營地，獲得寶藏
                            const luckyPlayerId = returningPlayers[0];
                            room.gameState.playerGold[luckyPlayerId] += treasureValue;
                            room.gameState.treasureInPlay = false;
                            room.gameState.treasureValue = 0;

                            // 記錄事件
                            room.gameState.eventLog.push(`treasure_${treasureValue}`);

                            // 設置最後一次行動結果
                            room.gameState.lastOutcome = {
                                type: 'treasure',
                                value: treasureValue,
                                luckyPlayer: luckyPlayerId,
                                timestamp: Date.now()
                            };
                        } else {
                            // 沒有玩家或多個玩家返回營地，寶藏保留在場上
                            // 記錄事件
                            room.gameState.eventLog.push(`treasure_${treasureValue}`);

                            // 設置最後一次行動結果
                            room.gameState.lastOutcome = {
                                type: 'treasure',
                                value: treasureValue,
                                treasureInPlay: true,
                                timestamp: Date.now()
                            };
                        }
                    } else if (outcome === 'danger') {
                        // 處理遇到危險的情況
                        // 檢查是否是重複的危險
                        const isDuplicateDanger = room.gameState.dangersEncountered.includes(dangerType);

                        // 添加危險到已遇到的危險列表
                        if (!isDuplicateDanger) {
                            room.gameState.dangersEncountered.push(dangerType);
                        }

                        // 記錄事件
                        room.gameState.eventLog.push(`danger_${dangerType}`);

                        // 設置最後一次行動結果，用於顯示玩家的實際選擇
                        room.gameState.lastOutcome = {
                            type: 'danger',
                            value: dangerType,
                            isDuplicate: isDuplicateDanger,
                            timestamp: Date.now() // 添加時間戳，用於判斷是否是新的行動結果
                        };

                        console.log(`遇到危險: roomId=${room.id}, dangerType=${dangerType}, isDuplicate=${isDuplicateDanger}`);

                        // 如果是重複的危險，顯示危險信息並結束回合
                        if (isDuplicateDanger) {
                            console.log(`遇到重複危險，處理回合結果: roomId=${room.id}`);

                            // 繼續探索的玩家失去所有未保存的金幣，且不會保存
                            const continuingPlayers = room.players.filter(
                                playerId => {
                                    // 檢查玩家是否已返回營地（在當前回合或之前的行動中）
                                    const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;
                                    // 只有未返回營地且選擇繼續探索的玩家才會受到危險影響
                                    return !hasReturnedToCamp && room.gameState.playerActions[playerId] === 'continue';
                                }
                            );

                            for (const playerId of continuingPlayers) {
                                room.gameState.playerGold[playerId] = 0;
                            }
                            
                            // 為返回營地的玩家保存金幣
                            const returningPlayers = room.players.filter(
                                playerId => room.gameState.playerActions[playerId] === 'return'
                            );
                            for (const playerId of returningPlayers) {
                                room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                                room.gameState.playerGold[playerId] = 0;
                                room.gameState.playerActions[playerId] = null;
                            }
                            
                            // 修正顯示在嵌入消息中的玩家狀態
                            const dangerEmbed = new EmbedBuilder()
                                .setTitle(`⚠️ 多人印加寶藏遊戲 - 遇到重複危險！`)
                                .setDescription(`遇到了第二個 ${dangerTypeMap[dangerType] || dangerType} 危險！回合結束，未返回營地的玩家失去所有金幣。`)
                                .setColor('#FF0000') // 紅色
                                .addFields(
                                    { name: '回合', value: `${room.gameState.currentRound}/${room.gameState.maxRounds}`, inline: true },
                                    { name: '行動次數', value: `${room.gameState.actionsInRound}/30`, inline: true }
                                )
                                .setFooter({ text: '印加寶藏多人遊戲', iconURL: client.user.displayAvatarURL() });

                            // 添加事件日誌
                            const eventLogText = room.gameState.eventLog.map(event => {
                                if (event.startsWith('gold_')) {
                                    const goldValue = event.split('_')[1];
                                    return `金幣 ${goldValue}`;
                                } else if (event.startsWith('danger_')) {
                                    const dangerType = event.split('_')[1];
                                    const dangerTypeMap = configManager.getDangerTypeMap();
                                    return dangerTypeMap[dangerType] || dangerType;
                                } else if (event.startsWith('treasure_')) {
                                    const treasureValue = event.split('_')[1];
                                    return `寶藏 ${treasureValue}`;
                                }
                                return event;
                            }).join(' → ');

                            dangerEmbed.addFields({ name: '事件日誌', value: eventLogText, inline: false });

                            // 添加玩家信息，顯示每個玩家的實際選擇和金幣
                            for (const playerId of room.players) {
                                const playerName = room.playerNames[playerId];
                                const playerGold = room.gameState.playerGold[playerId];
                                const playerSecuredGold = room.gameState.playerSecuredGold[playerId] || 0;
                                const hasReturnedToCamp = room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true;

                                let actionText;
                                if (hasReturnedToCamp || room.gameState.playerActions[playerId] === 'return') {
                                    actionText = '返回營地';
                                } else {
                                    actionText = '死亡';
                                }

                                dangerEmbed.addFields({
                                    name: playerName,
                                    value: `當前金幣: ${playerGold}\n已保存金幣: ${playerSecuredGold}\n行動: ${actionText}`,
                                    inline: true
                                });
                            }

                            // 使用共用組件創建下一回合按鈕
                            const row = createNextRoundButtons(room.id);

                            // 更新遊戲消息
                            try {
                                // 檢查 room.gameMessage 是否存在
                                if (room.gameMessage) {
                                    await room.gameMessage.edit({
                                        embeds: [dangerEmbed],
                                        components: [row]
                                    });
                                } else {
                                    // 如果 gameMessage 不存在，嘗試通過 channelId 和 messageId 獲取消息
                                    console.log(`嘗試獲取頻道和消息: roomId=${room.id}, channelId=${room.channelId}, messageId=${room.messageId}`);
                                    const channel = await client.channels.fetch(room.channelId);
                                    if (!channel) {
                                        console.error(`無法獲取頻道: roomId=${room.id}, channelId=${room.channelId}`);
                                        return;
                                    }

                                    const message = await channel.messages.fetch(room.messageId);
                                    if (!message) {
                                        console.error(`無法獲取消息: roomId=${room.id}, messageId=${room.messageId}`);
                                        return;
                                    }

                                    await message.edit({
                                        embeds: [dangerEmbed],
                                        components: [row]
                                    });

                                    // 保存消息引用以便將來使用
                                    room.gameMessage = message;
                                }
                            } catch (error) {
                                console.error(`更新遊戲消息時發生錯誤: roomId=${room.id}`, error);
                            }

                            // 不在這裡增加回合數，而是在點擊"下一回合"按鈕時增加

                            return;
                        }
                    }

                    // 更新遊戲消息，顯示當前行動結果
                    await updateGameMessage(client, room);

                    // 等待3秒，讓玩家有時間查看結果
                    console.log(`等待3秒，讓玩家查看結果: roomId=${room.id}`);

                    // 使用setTimeout等待3秒
                    setTimeout(async () => {
                        // 重置所有玩家的行動
                        for (const playerId of room.players) {
                            room.gameState.playerActions[playerId] = null;
                        }

                        // 再次更新遊戲消息，準備下一個行動
                        await updateGameMessage(client, room);

                        // 設置新的計時器
                        console.log(`設置新的計時器: roomId=${room.id}`);
                        setActionTimer();
                    }, 3000); // 3秒 = 3000毫秒
                } catch (error) {
                    console.error(`處理行動時發生錯誤: roomId=${room.id}`, error);
                }
            };

            // 定義設置計時器的函數
            const setActionTimer = () => {
                timerManager.setTimer(
                    `room_${room.id}`,
                    async () => {
                        console.log(`計時器回調觸發: roomId=${room.id}`);
                        await processAction();
                    },
                    async (remainingSeconds) => {
                        try {
                            // 獲取最新的消息
                            const fetchedMessage = await channel.messages.fetch(room.messageId);

                            // 獲取當前的嵌入消息
                            const currentEmbed = fetchedMessage.embeds[0];
                            if (!currentEmbed) {
                                console.error(`無法獲取當前嵌入消息: roomId=${room.id}`);
                                return;
                            }

                            // 創建新的嵌入消息
                            const updatedEmbed = EmbedBuilder.from(currentEmbed);

                            // 更新倒數計時字段
                            const fields = updatedEmbed.data.fields || [];
                            const countdownFieldIndex = fields.findIndex(field => field.name.includes('⏱️'));

                            if (countdownFieldIndex !== -1) {
                                fields[countdownFieldIndex].value = `${remainingSeconds} 秒`;
                                updatedEmbed.setFields(fields);

                                // 更新消息
                                await fetchedMessage.edit({ embeds: [updatedEmbed] });
                                //console.log(`倒數計時已更新: roomId=${room.id}, remainingSeconds=${remainingSeconds}`);
                            } else {
                                console.error(`找不到倒數計時字段: roomId=${room.id}`);
                            }
                        } catch (updateError) {
                            console.error(`更新倒數計時顯示時發生錯誤: roomId=${room.id}`, updateError);
                        }
                    },
                    20000 // 20秒
                );
                console.log(`計時器已設置: roomId=${room.id}`);
            };

            // 調用設置計時器函數
            setActionTimer();
        } catch (messageError) {
            console.error(`更新消息或設置計時器時發生錯誤: roomId=${room.id}`, messageError);
        }
    } catch (error) {
        console.error(`開始新回合時發生錯誤: roomId=${room ? room.id : 'unknown'}`, error);
    }
}













const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const messageManager = require('../../../utils/MessageManager');
const { getImageAttachment } = require('../../../utils/configManager');
const gameStateManager = require('../../../utils/GameStateManager');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName(messageManager.getMessage('command.game.name'))
        .setDescription(messageManager.getMessage('command.game.description'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('開始印加寶藏遊戲'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('重置遊戲狀態並開始新遊戲')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('重置模式')
                        .setRequired(true)
                        .addChoices(
                            { name: '重置所有狀態', value: 'all' },
                            { name: '只重置當前回合', value: 'current' }
                        ))),
    run: async (client, interaction) => {
        try {
            const subcommand = interaction.options.getSubcommand();

            // 處理子命令
            console.log(`處理子命令: ${subcommand}`);

            if (subcommand === 'start') {
                // 處理 start 子命令
                console.log('處理 start 子命令');

                // Get the welcome image
                const imageData = getImageAttachment('game.welcome.image');
                console.log('獲取歡迎圖片:', imageData);

                // Create attachments array for the files
                const attachments = [];
                if (imageData.attachment) {
                    attachments.push(imageData.attachment);
                }

                // Create a welcome embed for the game
                const gameEmbed = new EmbedBuilder()
                    .setTitle(messageManager.getMessage('game.welcome.title'))
                    .setDescription(messageManager.getMessage('game.welcome.description'))
                    .setColor(messageManager.getMessage('general.color'))
                    .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

                // Set the image if available
                if (imageData.url) {
                    gameEmbed.setImage(imageData.url);
                }

                // Create a button for starting the game
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('start_game')
                            .setLabel(messageManager.getMessage('button.start_game'))
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(messageManager.getMessage('emoji.start_game')),
                        new ButtonBuilder()
                            .setCustomId('rules')
                            .setLabel(messageManager.getMessage('button.game_rules'))
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(messageManager.getMessage('emoji.game_rules'))
                    );

                await interaction.reply({ embeds: [gameEmbed], components: [row], files: attachments });
            } else if (subcommand === 'reset') {
                    const mode = interaction.options.getString('mode');
                    const userId = interaction.user.id;

                    if (mode === 'all') {
                        // 完全重置遊戲狀態
                        gameStateManager.resetGameState(userId);

                        // 初始化新的遊戲狀態
                        gameStateManager.initializeGameState(userId);

                        // 回覆用戶
                        await interaction.reply({
                            content: '已重置所有遊戲狀態！開始新遊戲。',
                            ephemeral: true
                        });

                        // 獲取遊戲狀態
                        const gameState = gameStateManager.getGameState(userId);

                        // 獲取隨機寶藏圖片
                        const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
                        const randomTreasure = treasureValues[Math.floor(Math.random() * treasureValues.length)];
                        const imageData = getImageAttachment(`image.treasure.${randomTreasure}`);

                        // 創建附件數組
                        const attachments = [];
                        if (imageData.attachment) {
                            attachments.push(imageData.attachment);
                        }

                        // 創建遊戲開始嵌入訊息
                        const gameStartedEmbed = new EmbedBuilder()
                            .setTitle(messageManager.getMessage('game.started.title'))
                            .setDescription(messageManager.getMessage('game.started.description'))
                            .setColor(messageManager.getMessage('general.color'))
                            .addFields(
                                {
                                    name: '回合',
                                    value: `${gameState.currentRound}/${gameState.maxRounds}`,
                                    inline: true
                                },
                                {
                                    name: '行動次數',
                                    value: `${gameState.actionsInRound}/${gameState.maxActionsPerRound}`,
                                    inline: true
                                }
                            )
                            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

                        // 設置圖片
                        if (imageData.url) {
                            gameStartedEmbed.setImage(imageData.url);
                        }

                        // 創建遊戲操作按鈕
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('continue_exploring')
                                    .setLabel(messageManager.getMessage('button.continue_exploring'))
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji(messageManager.getMessage('emoji.continue_exploring')),
                                new ButtonBuilder()
                                    .setCustomId('show_treasures')
                                    .setLabel('查看寶藏')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('💰'),
                                new ButtonBuilder()
                                    .setCustomId('return_to_camp')
                                    .setLabel(messageManager.getMessage('button.return_to_camp'))
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji(messageManager.getMessage('emoji.return_to_camp'))
                            );

                        // 發送遊戲開始訊息
                        await interaction.followUp({ embeds: [gameStartedEmbed], components: [row], files: attachments });
                    } else if (mode === 'current') {
                        // 獲取遊戲狀態
                        let gameState = gameStateManager.getGameState(userId);

                        // 如果沒有遊戲狀態，初始化一個新的
                        if (!gameState) {
                            gameState = gameStateManager.initializeGameState(userId);
                            await interaction.reply({
                                content: '沒有找到現有遊戲狀態，已初始化新遊戲！',
                                ephemeral: true
                            });
                        } else {
                            // 重置當前回合
                            gameState.actionsInRound = 0;
                            gameState.treasures = 0;
                            gameState.dangersEncountered = [];
                            gameState.eventLog = [];

                            await interaction.reply({
                                content: '已重置當前回合狀態！',
                                ephemeral: true
                            });
                        }

                        // 獲取隨機寶藏圖片
                        const treasureValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
                        const randomTreasure = treasureValues[Math.floor(Math.random() * treasureValues.length)];
                        const imageData = getImageAttachment(`image.treasure.${randomTreasure}`);

                        // 創建附件數組
                        const attachments = [];
                        if (imageData.attachment) {
                            attachments.push(imageData.attachment);
                        }

                        // 創建遊戲開始嵌入訊息
                        const gameStartedEmbed = new EmbedBuilder()
                            .setTitle(messageManager.getMessage('game.started.title'))
                            .setDescription(messageManager.getMessage('game.started.description'))
                            .setColor(messageManager.getMessage('general.color'))
                            .addFields(
                                {
                                    name: '回合',
                                    value: `${gameState.currentRound}/${gameState.maxRounds}`,
                                    inline: true
                                },
                                {
                                    name: '行動次數',
                                    value: `${gameState.actionsInRound}/${gameState.maxActionsPerRound}`,
                                    inline: true
                                }
                            )
                            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

                        // 設置圖片
                        if (imageData.url) {
                            gameStartedEmbed.setImage(imageData.url);
                        }

                        // 創建遊戲操作按鈕
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('continue_exploring')
                                    .setLabel(messageManager.getMessage('button.continue_exploring'))
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji(messageManager.getMessage('emoji.continue_exploring')),
                                new ButtonBuilder()
                                    .setCustomId('show_treasures')
                                    .setLabel('查看寶藏')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('💰'),
                                new ButtonBuilder()
                                    .setCustomId('return_to_camp')
                                    .setLabel(messageManager.getMessage('button.return_to_camp'))
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji(messageManager.getMessage('emoji.return_to_camp'))
                            );

                        // 發送遊戲開始訊息
                        await interaction.followUp({ embeds: [gameStartedEmbed], components: [row], files: attachments });
                    }

            } else {
                // 未知子命令
                console.error(`未知子命令: ${subcommand}`);
                await interaction.reply({
                    content: '未知子命令，請使用 `/game start` 或 `/game reset`',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('執行遊戲命令時發生錯誤:', error);
            // 嘗試回覆一個錯誤消息
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '執行遊戲命令時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '執行遊戲命令時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('無法回覆錯誤消息:', replyError);
            }
        }
    }
}).toJSON();

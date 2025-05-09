const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const messageManager = require('../../../utils/MessageManager');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('顯示所有可用的指令'),
    run: async (client, interaction) => {
        try {
            // Create an embed for the commands
            const embed = new EmbedBuilder()
                .setTitle('🎮 印加寶藏遊戲指令列表')
                .setDescription('以下是所有可用的指令：')
                .setColor(messageManager.getMessage('general.color'))
                .addFields(
                    {
                        name: '📋 基本指令',
                        value:
                            '`/help` - 顯示幫助信息\n' +
                            '`/ping` - 檢查機器人的延遲\n' +
                            '`/commands` - 顯示此指令列表\n' +
                            '`/game start` - 開始印加寶藏遊戲',
                        inline: false
                    },
                    {
                        name: '👥 多人遊戲',
                        value:
                            '`/multiplayer create` - 創建一個新的多人遊戲房間\n' +
                            '`/multiplayer join room_id:[房間ID]` - 加入一個現有的多人遊戲房間\n' +
                            '`/multiplayer leave` - 離開當前的多人遊戲房間\n' +
                            '`/multiplayer start` - 開始多人遊戲 (僅房主可用)\n' +
                            '`/multiplayer list` - 列出所有可用的遊戲房間\n' +
                            '`/multiplayer add @玩家` - 添加玩家到房間 (僅房主可用)',
                        inline: false
                    }
                )
                .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Send the embed
            await interaction.reply({ embeds: [embed] });

            console.log(`顯示指令列表: userId=${interaction.user.id}`);
        } catch (error) {
            console.error('執行commands命令時發生錯誤:', error);
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

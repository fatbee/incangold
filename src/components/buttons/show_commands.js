const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');

module.exports = new Component({
    customId: 'show_commands',
    type: 'button',
    run: async (client, interaction) => {
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
                        '`/multiplayer add` - 添加玩家到房間 (僅房主可用)',
                    inline: false
                }
            )
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Create a back button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_game')
                    .setLabel(messageManager.getMessage('button.back_to_game'))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(messageManager.getMessage('emoji.back_to_game'))
            );

        await interaction.update({ embeds: [embed], components: [row] });
    }
}).toJSON();

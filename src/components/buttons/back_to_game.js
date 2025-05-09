const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messageManager = require('../../utils/MessageManager');

// 確保使用正確的 Component 類
const component = new Component({
    customId: 'back_to_game',
    type: 'button',
    run: async (client, interaction) => {
        try {
        // 創建多人模式信息嵌入消息
        const multiplayerEmbed = new EmbedBuilder()
            .setTitle('🎮 印加寶藏遊戲 - 多人模式')
            .setDescription('印加寶藏現在只支持多人模式！\n\n請使用以下命令來開始多人遊戲：')
            .setColor(messageManager.getMessage('general.color'))
            .addFields(
                { name: '創建房間', value: '`/multiplayer create`', inline: true },
                { name: '加入房間', value: '`/multiplayer join room_id:[房間ID]`', inline: true },
                { name: '查看房間列表', value: '`/multiplayer list`', inline: true }
            )
            .setFooter({ text: messageManager.getMessage('general.footer'), iconURL: client.user.displayAvatarURL() });

        // 創建按鈕
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('new_game')
                    .setLabel('創建新房間')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎮'),
                new ButtonBuilder()
                    .setCustomId('mp_rules')
                    .setLabel('遊戲規則')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📜'),
                new ButtonBuilder()
                    .setCustomId('show_commands')
                    .setLabel('指令列表')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        await interaction.update({ embeds: [multiplayerEmbed], components: [row] });
        } catch (error) {
            console.error('返回遊戲時發生錯誤:', error);
            // 嘗試回覆一個錯誤消息
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '返回遊戲時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '返回遊戲時發生錯誤，請稍後再試。',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('無法回覆錯誤消息:', replyError);
            }
        }
    }
});

// 導出組件
module.exports = component.toJSON();

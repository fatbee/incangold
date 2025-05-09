const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configManager = require('../../utils/configManager');

module.exports = new Component({
    customId: 'timer_off',
    type: 'button',
    run: async (client, interaction) => {
        try {
            // 設置計時器狀態為關閉
            configManager.setTimerEnabled(false);
            
            // 獲取當前計時器狀態
            const timerStatus = configManager.getProperty('config.timer.disabled');
            
            // 創建回覆嵌入消息
            const embed = new EmbedBuilder()
                .setTitle(configManager.getProperty('config.title'))
                .setDescription(configManager.getProperty('config.timer.success', timerStatus))
                .setColor('#0099ff')
                .addFields(
                    { name: configManager.getProperty('config.timer.name'), value: timerStatus, inline: true }
                )
                .setFooter({ text: configManager.getProperty('general.footer'), iconURL: client.user.displayAvatarURL() });
            
            // 創建按鈕
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('timer_on')
                        .setLabel('開啟計時器')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setCustomId('timer_off')
                        .setLabel('關閉計時器')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );
            
            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('處理計時器關閉按鈕時發生錯誤:', error);
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

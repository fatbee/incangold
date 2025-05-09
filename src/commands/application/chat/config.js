const { ApplicationCommand } = require('../../../structure/builders/application-command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configManager = require('../../../utils/configManager');

module.exports = new ApplicationCommand({
    command: {
        name: 'config',
        description: '管理遊戲設置',
        options: [
            {
                name: 'timer',
                description: '設置計時器開關',
                type: 1,
                options: [
                    {
                        name: 'status',
                        description: '計時器狀態',
                        type: 3,
                        required: true,
                        choices: [
                            { name: '開啟', value: 'on' },
                            { name: '關閉', value: 'off' }
                        ]
                    }
                ]
            },
            {
                name: 'show',
                description: '顯示當前設置',
                type: 1
            }
        ]
    },
    run: async (client, interaction) => {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'timer') {
                const status = interaction.options.getString('status');
                const enabled = status === 'on';

                // 設置計時器狀態
                configManager.setTimerEnabled(enabled);

                // 創建回覆嵌入消息
                const statusText = enabled
                    ? configManager.getProperty('config.timer.enabled')
                    : configManager.getProperty('config.timer.disabled');

                const embed = new EmbedBuilder()
                    .setTitle(configManager.getProperty('config.title'))
                    .setDescription(configManager.getProperty('config.timer.success', statusText))
                    .setColor('#0099ff')
                    .addFields(
                        { name: configManager.getProperty('config.timer.name'), value: statusText, inline: true }
                    )
                    .setFooter({ text: configManager.getProperty('general.footer'), iconURL: client.user.displayAvatarURL() });

                await interaction.reply({ embeds: [embed] });
            } else if (subcommand === 'show') {
                // 獲取當前計時器狀態
                const timerEnabled = configManager.isTimerEnabled();
                const timerStatus = timerEnabled
                    ? configManager.getProperty('config.timer.enabled')
                    : configManager.getProperty('config.timer.disabled');

                // 創建回覆嵌入消息
                const embed = new EmbedBuilder()
                    .setTitle(configManager.getProperty('config.title'))
                    .setDescription(configManager.getProperty('config.description'))
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
                            .setStyle(timerEnabled ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(timerEnabled),
                        new ButtonBuilder()
                            .setCustomId('timer_off')
                            .setLabel('關閉計時器')
                            .setStyle(!timerEnabled ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(!timerEnabled)
                    );

                await interaction.reply({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('執行配置命令時發生錯誤:', error);
            try {
                await interaction.reply({
                    content: '執行命令時發生錯誤，請稍後再試。',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('回覆錯誤:', replyError);
            }
        }
    }
}).toJSON();

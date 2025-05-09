const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * 創建遊戲行動按鈕
 * @param {string} roomId - 房間ID
 * @returns {ActionRowBuilder} - 包含遊戲行動按鈕的行
 */
function createGameActionButtons(roomId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`mp_continue_${roomId}`)
                .setLabel('繼續探索')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔍'),
            new ButtonBuilder()
                .setCustomId(`mp_return_${roomId}`)
                .setLabel('返回營地')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🏕️'),
            new ButtonBuilder()
                .setCustomId(`show_gold_mp`)
                .setLabel('查看金幣')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💰')
        );
}

/**
 * 創建下一回合按鈕
 * @param {string} roomId - 房間ID
 * @returns {ActionRowBuilder} - 包含下一回合按鈕的行
 */
function createNextRoundButtons(roomId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`next_round_${roomId}`)
                .setLabel('下一回合')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️'),
            new ButtonBuilder()
                .setCustomId(`show_gold_mp`)
                .setLabel('查看金幣')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💰')
        );
}

module.exports = {
    createGameActionButtons,
    createNextRoundButtons
};
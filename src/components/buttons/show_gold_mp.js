const { Component } = require('../../structure/builders/component.js');
const { EmbedBuilder } = require('discord.js');
const gameRoomManager = require('../../utils/GameRoomManager.js');

module.exports = new Component({
    customId: 'show_gold_mp',
    type: 'button',
    run: async (client, interaction) => {
        try {
            // 獲取玩家ID
            const userId = interaction.user.id;

            // 檢查玩家是否在房間中
            const room = gameRoomManager.getPlayerRoom(userId);
            if (!room) {
                await interaction.reply({
                    content: '你不在任何房間中。',
                    ephemeral: true
                });
                return;
            }

            // 檢查遊戲狀態
            if (room.status !== 'playing') {
                await interaction.reply({
                    content: '遊戲尚未開始或已經結束。',
                    ephemeral: true
                });
                return;
            }

            // 獲取玩家的金幣信息
            const playerGold = room.gameState.playerGold[userId] || 0;
            const playerSecuredGold = room.gameState.playerSecuredGold[userId] || 0;
            // 總金幣只計算已保存的金幣，不包括當前回合的金幣
            const totalGold = playerSecuredGold;

            // 創建一個嵌入訊息，只有玩家自己可見
            const goldEmbed = new EmbedBuilder()
                .setTitle('💰 你的金幣')
                .setDescription(`這是你當前的金幣信息，只有你能看到這條訊息。\n注意：總金幣只計算已保存的金幣，當前回合的金幣需要成功返回營地後才會計入總數。`)
                .setColor('#FFD700') // Gold color
                .addFields(
                    { name: '當前回合金幣', value: `${playerGold} 金幣`, inline: true },
                    { name: '已保存金幣', value: `${playerSecuredGold} 金幣`, inline: true },
                    { name: '總金幣', value: `${totalGold} 金幣`, inline: true }
                )
                .setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

            // 使用 ephemeral 回覆，只有玩家自己可見
            await interaction.reply({
                embeds: [goldEmbed],
                ephemeral: true // 設置為 true，使訊息只有玩家自己可見
            });
        } catch (error) {
            console.error('處理查看金幣按鈕時發生錯誤:', error);
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



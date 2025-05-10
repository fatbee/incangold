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

            // 獲取玩家收集的寶藏總值
            const playerName = interaction.user.username;
            const playerCollectedTreasures = room.gameState.playerCollectedTreasures[userId] || [];

            console.log(`\n========================================`);
            console.log(`玩家查看金幣餘額`);
            console.log(`房間ID: ${room.id}`);
            console.log(`玩家ID: ${userId}`);
            console.log(`玩家名稱: ${playerName}`);
            console.log(`玩家寶藏列表: ${JSON.stringify(playerCollectedTreasures)}`);
            console.log(`房間狀態: ${room.status}`);
            console.log(`當前回合: ${room.gameState.currentRound}`);
            console.log(`最大回合數: ${room.gameState.maxRounds}`);
            console.log(`玩家數量: ${room.players.length}`);
            console.log(`寶藏在場上: ${room.gameState.treasureInPlay ? '是' : '否'}`);
            console.log(`寶藏值: ${room.gameState.treasureValue}`);
            console.log(`========================================\n`);

            console.log(`查看金幣: 玩家寶藏列表: playerId=${userId}, treasures=${JSON.stringify(playerCollectedTreasures)}`);
            console.log(`查看金幣: 房間所有寶藏列表: roomId=${room.id}, allTreasures=${JSON.stringify(room.gameState.playerCollectedTreasures)}`);
            const treasureSum = playerCollectedTreasures.reduce((sum, value) => sum + value, 0);
            console.log(`查看金幣: 玩家寶藏總值: playerId=${userId}, treasureSum=${treasureSum}`);

            if (playerCollectedTreasures.length > 0) {
                console.log(`\n✅ 玩家有收集的寶藏！總值: ${treasureSum}\n`);
                console.log(`寶藏列表: ${playerCollectedTreasures.map(t => `寶藏 ${t}`).join(', ')}`);
            } else {
                console.log(`\n❌ 玩家沒有收集任何寶藏\n`);
                console.log(`檢查房間寶藏狀態: treasureInPlay=${room.gameState.treasureInPlay}, treasureValue=${room.gameState.treasureValue}`);
            }

            // 總金幣計算已保存的金幣和寶藏總值，不包括當前回合的金幣
            const totalGold = playerSecuredGold + treasureSum;
            const treasuresText = playerCollectedTreasures.length > 0
                ? playerCollectedTreasures.map(value => `寶藏 ${value}`).join(', ')
                : '尚未收集任何寶藏';

            // 創建總分顯示文本
            let scoreText = `金幣: ${playerSecuredGold}`;
            if (treasureSum > 0) {
                scoreText += ` + 寶藏: ${treasureSum}`;
            }
            scoreText += ` = 總分: ${totalGold}`;

            // 創建一個嵌入訊息，只有玩家自己可見
            const goldEmbed = new EmbedBuilder()
                .setTitle('💰 你的金幣')
                .setDescription(`這是你當前的金幣信息，只有你能看到這條訊息。\n注意：總金幣只計算已保存的金幣，當前回合的金幣需要成功返回營地後才會計入總數。`)
                .setColor('#FFD700') // Gold color
                .addFields(
                    { name: '當前回合金幣', value: `${playerGold} 金幣`, inline: true },
                    { name: '已保存金幣', value: `${playerSecuredGold} 金幣`, inline: true },
                    { name: '總分', value: scoreText, inline: false }
                );

            // 只有在有寶藏時才添加寶藏字段
            if (playerCollectedTreasures.length > 0) {
                goldEmbed.addFields({ name: '已帶走寶藏', value: treasuresText, inline: false });
            } else {
                goldEmbed.addFields({ name: '已帶走寶藏', value: '尚未收集任何寶藏', inline: false });
            }

            goldEmbed.setFooter({ text: '印加寶藏遊戲', iconURL: client.user.displayAvatarURL() });

            // 使用 ephemeral 回覆，只有玩家自己可見
            await interaction.reply({
                embeds: [goldEmbed],
                ephemeral: true // 設置為 true，使訊息只有玩家自己可見
            });

            // 顯示最終結果的日誌
            console.log(`\n========================================`);
            console.log(`玩家金幣餘額顯示完成`);
            console.log(`玩家ID: ${userId}`);
            console.log(`玩家名稱: ${interaction.user.username}`);
            console.log(`當前回合金幣: ${playerGold}`);
            console.log(`已保存金幣: ${playerSecuredGold}`);
            console.log(`寶藏總值: ${treasureSum}`);
            console.log(`總分: ${totalGold}`);
            console.log(`========================================\n`);
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



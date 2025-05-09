/**
 * 遊戲房間管理器
 * 用於管理多人遊戲房間，包括玩家加入、離開、遊戲狀態等
 */

class GameRoomManager {
    constructor() {
        this.gameRooms = new Map(); // 存儲所有遊戲房間
        this.playerToRoom = new Map(); // 玩家ID到房間ID的映射
    }

    /**
     * 創建新的遊戲房間
     * @param {string} hostId - 房主的Discord ID
     * @returns {string} 房間ID
     */
    createRoom(hostId) {
        // 生成唯一的房間ID
        const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // 創建房間對象
        const room = {
            id: roomId,
            hostId: hostId,
            players: [hostId], // 初始只有房主
            playerNames: {}, // 玩家ID到玩家名稱的映射
            playerAvatars: {}, // 玩家ID到頭像URL的映射
            status: 'waiting', // 房間狀態: waiting, playing, finished
            gameState: {
                currentRound: 0,
                maxRounds: 5,
                actionsInRound: 0,
                maxActionsPerRound: 30,
                gold: 0, // 當前回合的總金幣
                playerGold: {}, // 每個玩家的金幣
                playerSecuredGold: {}, // 每個玩家已保存的金幣
                playerActions: {}, // 每個玩家的行動選擇
                dangersEncountered: [], // 當前回合遇到的危險
                eventLog: [], // 事件記錄
                lastOutcome: null, // 最後一次行動的結果
                timer: null, // 計時器
                timerEndTime: 0, // 計時器結束時間
                treasureCards: [5, 7, 8, 10, 12], // 寶藏卡的價值
                currentTreasure: null, // 當前回合的寶藏卡
                treasureInPlay: false, // 是否有寶藏卡在場上
                treasureValue: 0, // 當前寶藏卡的價值
                usedTreasures: [], // 已使用的寶藏卡
                roundDeck: [], // 當前回合的卡牌組
            },
            messageId: null, // 遊戲消息的ID
            channelId: null, // 遊戲頻道的ID
        };

        // 初始化玩家金幣和行動
        room.gameState.playerGold[hostId] = 0;
        room.gameState.playerSecuredGold[hostId] = 0;
        room.gameState.playerActions[hostId] = null;

        // 存儲房間
        this.gameRooms.set(roomId, room);

        // 將玩家映射到房間
        this.playerToRoom.set(hostId, roomId);

        return roomId;
    }

    /**
     * 獲取遊戲房間
     * @param {string} roomId - 房間ID
     * @returns {Object|null} 房間對象或null（如果不存在）
     */
    getRoom(roomId) {
        return this.gameRooms.get(roomId) || null;
    }

    /**
     * 獲取所有等待中的遊戲房間
     * @returns {Array} 房間對象數組
     */
    getAllWaitingRooms() {
        const waitingRooms = [];
        for (const [, room] of this.gameRooms.entries()) {
            if (room.status === 'waiting') {
                waitingRooms.push(room);
            }
        }
        return waitingRooms;
    }

    /**
     * 獲取玩家所在的房間
     * @param {string} playerId - 玩家的Discord ID
     * @returns {Object|null} 房間對象或null（如果不存在）
     */
    getPlayerRoom(playerId) {
        const roomId = this.playerToRoom.get(playerId);
        if (!roomId) return null;
        return this.getRoom(roomId);
    }

    /**
     * 玩家加入房間
     * @param {string} roomId - 房間ID
     * @param {string} playerId - 玩家的Discord ID
     * @param {string} playerName - 玩家名稱
     * @param {string} playerAvatar - 玩家頭像URL
     * @returns {boolean} 是否成功加入
     */
    joinRoom(roomId, playerId, playerName, playerAvatar) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'waiting') return false;

        // 檢查玩家是否已經在房間中
        if (room.players.includes(playerId)) return true;

        // 將玩家添加到房間
        room.players.push(playerId);
        room.playerNames[playerId] = playerName;
        room.playerAvatars[playerId] = playerAvatar;

        // 初始化玩家金幣和行動
        room.gameState.playerGold[playerId] = 0;
        room.gameState.playerSecuredGold[playerId] = 0;
        room.gameState.playerActions[playerId] = null;

        // 將玩家映射到房間
        this.playerToRoom.set(playerId, roomId);

        return true;
    }

    /**
     * 玩家離開房間
     * @param {string} playerId - 玩家的Discord ID
     * @returns {boolean} 是否成功離開
     */
    leaveRoom(playerId) {
        const room = this.getPlayerRoom(playerId);
        if (!room) return false;

        // 如果是房主離開，解散房間
        if (room.hostId === playerId) {
            return this.disbandRoom(room.id);
        }

        // 將玩家從房間中移除
        const index = room.players.indexOf(playerId);
        if (index !== -1) {
            room.players.splice(index, 1);
        }

        // 移除玩家的金幣和行動記錄
        delete room.gameState.playerGold[playerId];
        delete room.gameState.playerSecuredGold[playerId];
        delete room.gameState.playerActions[playerId];
        delete room.playerNames[playerId];
        delete room.playerAvatars[playerId];

        // 移除玩家到房間的映射
        this.playerToRoom.delete(playerId);

        return true;
    }

    /**
     * 解散房間
     * @param {string} roomId - 房間ID
     * @returns {boolean} 是否成功解散
     */
    disbandRoom(roomId) {
        const room = this.getRoom(roomId);
        if (!room) return false;

        // 移除所有玩家到房間的映射
        for (const playerId of room.players) {
            this.playerToRoom.delete(playerId);
        }

        // 移除房間
        this.gameRooms.delete(roomId);

        return true;
    }

    /**
     * 開始遊戲
     * @param {string} roomId - 房間ID
     * @returns {boolean} 是否成功開始
     */
    startGame(roomId) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'waiting' || room.players.length < 2) return false;

        // 更新房間狀態
        room.status = 'playing';
        room.gameState.currentRound = 1;

        return true;
    }

    /**
     * 設置玩家行動
     * @param {string} playerId - 玩家的Discord ID
     * @param {string} action - 行動類型 ('continue' 或 'return')
     * @returns {boolean} 是否成功設置
     */
    setPlayerAction(playerId, action) {
        const room = this.getPlayerRoom(playerId);
        if (!room || room.status !== 'playing') return false;

        // 設置玩家行動
        room.gameState.playerActions[playerId] = action;

        return true;
    }

    /**
     * 檢查是否所有玩家都已選擇行動
     * @param {string} roomId - 房間ID
     * @returns {boolean} 是否所有玩家都已選擇行動
     */
    allPlayersActed(roomId) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'playing') return false;

        // 檢查每個玩家是否都已選擇行動，跳過已返回營地的玩家
        for (const playerId of room.players) {
            // 跳過已經返回營地的玩家（通過playerActions或playerReturned標記）
            if (room.gameState.playerActions[playerId] === 'return' ||
                (room.gameState.playerReturned && room.gameState.playerReturned[playerId] === true)) {
                continue;
            }

            if (room.gameState.playerActions[playerId] === null) {
                return false;
            }
        }

        return true;
    }

    /**
     * 處理回合結果
     * @param {string} roomId - 房間ID
     * @returns {Object} 回合結果
     */
    processRoundResult(roomId) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'playing') return null;

        // 獲取繼續探索的玩家
        const continuingPlayers = room.players.filter(
            playerId => room.gameState.playerActions[playerId] === 'continue'
        );

        // 獲取返回營地的玩家
        const returningPlayers = room.players.filter(
            playerId => room.gameState.playerActions[playerId] === 'return'
        );

        // 如果沒有玩家繼續探索，所有玩家都返回營地
        if (continuingPlayers.length === 0) {
            // 處理所有玩家返回營地的情況
            for (const playerId of room.players) {
                // 將當前金幣添加到已保存的金幣中
                room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                // 重置當前金幣
                room.gameState.playerGold[playerId] = 0;
                // 重置玩家行動
                room.gameState.playerActions[playerId] = null;
            }

            // 進入下一回合
            room.gameState.currentRound++;
            room.gameState.actionsInRound = 0;
            room.gameState.gold = 0;
            room.gameState.dangersEncountered = [];
            room.gameState.eventLog = [];
            room.gameState.lastOutcome = null;

            // 檢查遊戲是否結束
            if (room.gameState.currentRound > room.gameState.maxRounds) {
                room.status = 'finished';
            }

            return {
                type: 'all_returned',
                returningPlayers,
                nextRound: room.gameState.currentRound,
                isGameOver: room.status === 'finished'
            };
        }

        // 處理繼續探索的情況
        // 從回合卡牌組中抽取下一張卡
        let outcome;
        let goldValue = 0;
        let dangerType = '';
        let treasureValue = 0;

        // 如果回合卡牌組為空，重新初始化
        if (!room.gameState.roundDeck || room.gameState.roundDeck.length === 0) {
            // 這裡不能直接調用 initializeRoundDeck，因為它在另一個模塊中
            // 我們只能在這裡簡單地模擬抽卡結果
            const outcomes = ['gold', 'gold', 'gold', 'danger', 'treasure'];
            outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

            if (outcome === 'gold') {
                const goldValues = [5, 7, 8, 9, 10, 11, 12, 15, 17];
                goldValue = goldValues[Math.floor(Math.random() * goldValues.length)];
            } else if (outcome === 'danger') {
                const dangerTypes = ['snake', 'spider', 'mummy', 'fire', 'rockfall'];
                dangerType = dangerTypes[Math.floor(Math.random() * dangerTypes.length)];
            } else if (outcome === 'treasure') {
                const treasureValues = [5, 7, 8, 10, 12];
                treasureValue = treasureValues[Math.floor(Math.random() * treasureValues.length)];
            }
        } else {
            // 從卡牌組中抽取
            const card = room.gameState.roundDeck.pop();

            if (card.type === 'gold') {
                outcome = 'gold';
                goldValue = card.value;
            } else if (card.type === 'danger') {
                outcome = 'danger';
                dangerType = card.value;
            } else if (card.type === 'treasure') {
                outcome = 'treasure';
                treasureValue = card.value;
            }
        }

        if (outcome === 'gold') {
            // 處理金幣

            // 計算每個繼續探索的玩家獲得的金幣
            const goldPerPlayer = Math.floor(goldValue / continuingPlayers.length);

            // 為每個繼續探索的玩家添加金幣
            for (const playerId of continuingPlayers) {
                room.gameState.playerGold[playerId] += goldPerPlayer;
            }

            // 記錄事件
            room.gameState.eventLog.push(`gold_${goldValue}`);
            room.gameState.gold += goldValue;
            room.gameState.lastOutcome = {
                type: 'gold',
                value: goldValue,
                goldPerPlayer
            };

            // 為返回營地的玩家保存金幣
            for (const playerId of returningPlayers) {
                room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                room.gameState.playerGold[playerId] = 0;
                room.gameState.playerActions[playerId] = null;
            }

            // 重置所有玩家的行動
            for (const playerId of continuingPlayers) {
                room.gameState.playerActions[playerId] = null;
            }

            return {
                type: 'gold',
                value: goldValue,
                goldPerPlayer,
                continuingPlayers,
                returningPlayers
            };
        } else if (outcome === 'treasure') {
            // 處理寶藏卡
            console.log(`處理寶藏卡: roomId=${roomId}, treasureValue=${treasureValue}`);

            // 設置寶藏卡在場上
            room.gameState.treasureInPlay = true;
            room.gameState.treasureValue = treasureValue;

            // 記錄事件
            room.gameState.eventLog.push(`treasure_${treasureValue}`);

            // 檢查是否有唯一一個返回營地的玩家
            if (returningPlayers.length === 1) {
                // 只有一個玩家返回營地，獲得寶藏
                const luckyPlayerId = returningPlayers[0];
                room.gameState.playerGold[luckyPlayerId] += treasureValue;
                room.gameState.treasureInPlay = false;
                room.gameState.treasureValue = 0;

                // 為返回營地的玩家保存金幣
                for (const playerId of returningPlayers) {
                    room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                    room.gameState.playerGold[playerId] = 0;
                    room.gameState.playerActions[playerId] = null;
                }

                // 重置所有玩家的行動
                for (const playerId of continuingPlayers) {
                    room.gameState.playerActions[playerId] = null;
                }

                return {
                    type: 'treasure',
                    value: treasureValue,
                    luckyPlayer: luckyPlayerId,
                    continuingPlayers,
                    returningPlayers
                };
            } else {
                // 沒有玩家或多個玩家返回營地，寶藏保留在場上
                // 為返回營地的玩家保存金幣
                for (const playerId of returningPlayers) {
                    room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                    room.gameState.playerGold[playerId] = 0;
                    room.gameState.playerActions[playerId] = null;
                }

                // 重置所有玩家的行動
                for (const playerId of continuingPlayers) {
                    room.gameState.playerActions[playerId] = null;
                }

                return {
                    type: 'treasure',
                    value: treasureValue,
                    treasureInPlay: true,
                    continuingPlayers,
                    returningPlayers
                };
            }
        } else {
            // 危險類型
            const dangerTypes = ['snake', 'spider', 'mummy', 'fire', 'rockfall'];
            const dangerType = dangerTypes[Math.floor(Math.random() * dangerTypes.length)];

            // 檢查是否是重複的危險
            const isDuplicateDanger = room.gameState.dangersEncountered.includes(dangerType);

            // 記錄危險
            room.gameState.dangersEncountered.push(dangerType);
            room.gameState.eventLog.push(`danger_${dangerType}`);
            room.gameState.lastOutcome = {
                type: 'danger',
                value: dangerType,
                isDuplicate: isDuplicateDanger
            };

            // 如果是重複的危險，所有繼續探索的玩家失去所有未保存的金幣，且不會保存當前回合的金幣
            if (isDuplicateDanger) {
                // 繼續探索的玩家失去所有未保存的金幣，且不會保存
                for (const playerId of continuingPlayers) {
                    room.gameState.playerGold[playerId] = 0;
                }

                // 不清空事件記錄，保留給結果嵌入消息使用

                // 進入下一回合
                room.gameState.currentRound++;
                room.gameState.actionsInRound = 0;
                room.gameState.gold = 0;
                room.gameState.dangersEncountered = [];
                // 不清空事件記錄，保留給結果嵌入消息使用
                // 在startNewRound函數中會清空事件記錄

                // 檢查遊戲是否結束
                if (room.gameState.currentRound > room.gameState.maxRounds) {
                    room.status = 'finished';
                }
            }

            // 為返回營地的玩家保存金幣
            // 如果是重複危險，只有返回營地的玩家才能保存金幣
            if (isDuplicateDanger) {
                // 只為返回營地的玩家保存金幣
                for (const playerId of returningPlayers) {
                    room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                    room.gameState.playerGold[playerId] = 0;
                    room.gameState.playerActions[playerId] = null;
                }

                // 繼續探索的玩家失去所有未保存的金幣，且不會保存
                for (const playerId of continuingPlayers) {
                    room.gameState.playerGold[playerId] = 0;
                    room.gameState.playerActions[playerId] = null;
                }
            } else {
                // 正常情況下，為返回營地的玩家保存金幣
                for (const playerId of returningPlayers) {
                    room.gameState.playerSecuredGold[playerId] += room.gameState.playerGold[playerId];
                    room.gameState.playerGold[playerId] = 0;
                    room.gameState.playerActions[playerId] = null;
                }
            }

            // 重置所有玩家的行動
            for (const playerId of continuingPlayers) {
                room.gameState.playerActions[playerId] = null;
            }

            return {
                type: 'danger',
                value: dangerType,
                isDuplicate: isDuplicateDanger,
                continuingPlayers,
                returningPlayers,
                nextRound: isDuplicateDanger ? room.gameState.currentRound : null,
                isGameOver: room.status === 'finished'
            };

        }
    }
}

// 創建單例實例
const gameRoomManager = new GameRoomManager();

module.exports = gameRoomManager;


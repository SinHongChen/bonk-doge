const auth = require('../../models/auth');
const redis = require('../../models/redis');
const Deck = require('../../models/deck');
const Card = require('../../models/card');
const GameRecord = require('../../models/gameRecord');
const { sleep } = require('../../models/util');
const { validate: uuidValidate } = require('uuid');
const moment = require('moment');
const event = "mainGame";

const GAME_INFO = { "state": 200, "msg": "GAME_INFO", "data": {} };
const RESULT = { "state": 200, "msg": "GAME_OVER", "data": {} };
const NO_AUTH = { "state": 401, "msg": "TOKEN_NOT_GOOD", "data": null };
const ERROR = { "state": 500, "msg": "INTERNAL_SERVER_ERROR", "data": null };

const HP = 4000;
const FIRST_TAKE_CARD = 3;

const getPlayer = async (clientID) => {
    const playerJSON = await redis.getPlayer(clientID);
    const player = JSON.parse(playerJSON);
    return player;
}

const getPlayerResult = async (player) => {
    let enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    const res = {
        'currentPlayer': player.currentPlayer,
        'self': {
            boardCards: player.boardCards,
            coveredCards: player.coveredCards,
            handCards: player.handCards,
            remainingCardsNumber: player.remainingCards.length,
            hp: player.hp,
        },
        'enemy': {
            boardCards: enemy.boardCards,
            coveredCardsNumber: enemy.coveredCards.length,
            handCardsNumber: enemy.handCards.length,
            remainingCardsNumber: enemy.remainingCards.length,
            hp: enemy.hp,
        }
    }
    return res;
}

const sendDataToPlayerAndEnemy = async (client) => {
    const clientID = client.id;
    // send data to player
    const player = JSON.parse(await redis.getPlayer(clientID));
    const playerRes = await getPlayerResult(player);
    console.log('player ==', JSON.stringify({ ...GAME_INFO, 'data': playerRes }));
    client.emit(event, JSON.stringify({ ...GAME_INFO, 'data': playerRes }));
    // send data to enemy
    const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    const enemyRes = await getPlayerResult(enemy);
    console.log('enemy ==', JSON.stringify({ ...GAME_INFO, 'data': enemyRes }));
    client.to(player.enemyClientID).emit(event, JSON.stringify({ ...GAME_INFO, 'data': enemyRes }));
}

const _takeCard = (player) => {
    const random = Math.floor(Math.random() * player.remainingCards.length);
    const card = player.remainingCards.splice(random, 1); // 抽出並移除原本的牌
    player.handCards = player.handCards.concat(card);
}

const gameRecord = async (winner, loser, isTie) => {
    const startTime = winner.startTime > loser.startTime ? winner.startTime : loser.startTime;
    const record = {
        Winner: winner.userID,
        Loser: loser.userID,
        IsTie: isTie,
        Winner_Cards: JSON.stringify(winner.deckCards),
        Loser_Cards: JSON.stringify(loser.deckCards),
        Total_Time: moment().diff(startTime, 'minutes'),
    };
    // game record
    await GameRecord.create(record);
}

const init = async (client, data) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const sessionID = client.handshake.headers['session-id'];
    const session = JSON.parse(await redis.getSess(sessionID));
    const deck = await Deck.get({ ID: data.deck });

    // for game record
    player.startTime = moment();
    player.deckCards = deck.Cards;
    // game
    player.userID = session.userID;
    player.remainingCards = deck.Cards;
    player.boardCards = [];
    player.coveredCards = [];
    player.handCards = [];
    player.hp = HP;
    player.init = true;
    // 起手抽牌
    for (let i = 0; i < FIRST_TAKE_CARD; i++)
        _takeCard(player);
    await redis.setPlayer(clientID, JSON.stringify(player));

    // 誰先init完，誰先開始，開始後順便多抽牌
    let enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    if (!enemy.init) {
        player.currentPlayer = player.userID;
        _takeCard(player);
    } else {
        player.currentPlayer = player.enemyUserID;
    }

    // wait enemy init
    while (!enemy.init) {
        console.log('wait enemy init');
        await sleep(1);
        enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    }

    const res = await getPlayerResult(player);
    // save data
    await redis.setPlayer(clientID, JSON.stringify(player));
    // send data
    console.log(JSON.stringify({ ...GAME_INFO, 'data': res }));
    client.emit(event, JSON.stringify({ ...GAME_INFO, 'data': res }));
}

// const takeCard = async (client) => {
//     const clientID = client.id;
//     const player = await getPlayer(clientID);
//     const random = Math.floor(Math.random() * player.remainingCards.length);
//     const card = player.remainingCards.splice(random, 1); // 抽出並移除原本的牌
//     player.handCards = player.handCards.concat(card);
//     // save data   
//     await redis.setPlayer(clientID, JSON.stringify(player));
//     // send data
//     await sendDataToPlayerAndEnemy(client);
// }

const putCard = async (client, data) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const index = player.handCards.indexOf(data.card); // find card index of remainingCards
    if (index < 0) {
        throw new Error('Put card not found in handCards ' + data.card);
    }
    const card = player.handCards.splice(index, 1); // 抽出並移除原本的牌
    const cardInfo = await Card.get(card);
    if (cardInfo.Nature_ID === 2 && player.coveredCards.length > 0) {
        throw new Error('Already have covered cards on board ' + data.card);
    }
    if (cardInfo.Nature_ID === 2) // covered trap card
        player.coveredCards = player.coveredCards.concat(card);
    else
        player.boardCards = player.boardCards.concat(card);
    // save data   
    await redis.setPlayer(clientID, JSON.stringify(player));
    // send data
    await sendDataToPlayerAndEnemy(client);
}

const assert = async (client, data) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    const card = await Card.get(data.card);
    const action = data.action;
    // check player card on board
    const playerCardIndex = player.boardCards.indexOf(data.card); // find card index of remainingCards
    if (playerCardIndex < 0) {
        throw new Error('Card not found on player board ' + data.card);
    }
    // coveredCards
    const playerCoveredCards = await Card.getCards(player.coveredCards);
    const enemyCoveredCards = await Card.getCards(enemy.coveredCards);
    // TODO: coveredCards check

    if (action === 'attack') {
        // TODO: card assert

        // attack
        if (uuidValidate(data.target)) { // attack card
            const target = await Card.get(data.target);
            // check player card on board
            const enemyCardIndex = enemy.boardCards.indexOf(data.target); // find card index of remainingCards
            if (enemyCardIndex < 0) {
                throw new Error('Card not found on enemy board ' + data.card);
            }

            if (card.Attack > target.Defense) {
                // 對方卡牌被破壞，敵方會受到傷害
                // delete target card
                enemy.boardCards.splice(enemyCardIndex, 1)
                // attack enemy
                const attack = card.Attack - target.Defense;
                enemy.hp -= attack;
            } else if (card.Attack === target.Defense) {
                // 雙方卡牌都會被破壞
                player.boardCards.splice(playerCardIndex, 1)
                enemy.boardCards.splice(enemyCardIndex, 1)
            } else {
                // 我方卡牌被破壞，我會受到傷害
                // delete player card
                player.boardCards.splice(playerCardIndex, 1)
                // attack player
                const attack = target.Defense - card.Attack;
                player.hp -= attack;
            }
        } else if (data.target === 'player') { // attack player
            if (enemy.boardCards.length > 0) {
                throw new Error('Enemy have other cards on board, player can\'t attack enemy directly');
            }
            enemy.hp -= card.Attack;
        } else {
            throw new Error('Invalid target ' + data.target);
        }
    } else if (action === 'effect') {
        // TODO: effect
    } else {
        throw new Error('Invalid action ' + action);
    }

    // save data   
    await redis.setPlayer(clientID, JSON.stringify(player));
    await redis.setPlayer(player.enemyClientID, JSON.stringify(enemy));
    // 其中一方生命值歸零，結束遊戲
    if (player.hp <= 0 || enemy.hp <= 0)
        await endGame(client);
    else {
        // send data
        await sendDataToPlayerAndEnemy(client);
    }
}

const endTurn = async (client) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    // 雙方牌底都沒牌，結束遊戲
    if (player.remainingCards.length === 0 && enemy.remainingCards.length === 0)
        await endGame(client);

    // currentPlayer change
    const currentPlayer = player.currentPlayer === player.userID ? enemy.userID : player.userID;
    player.currentPlayer = currentPlayer;
    enemy.currentPlayer = currentPlayer;

    // currentPlayer take card
    const _player = player.currentPlayer === player.userID ? player : enemy;
    _takeCard(_player);

    // save data
    await redis.setPlayer(clientID, JSON.stringify(player));
    await redis.setPlayer(player.enemyClientID, JSON.stringify(enemy));
    // send data
    await sendDataToPlayerAndEnemy(client);
}

const surrender = async (client) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    // game record
    await gameRecord(enemy, player, false);
    // send data
    const data = { 'winner': enemy.userID, 'reason': 'SURRENDER' };
    client.emit(event, JSON.stringify({ ...RESULT, data }));
    client.to(player.enemyClientID).emit(event, JSON.stringify({ ...RESULT, data }));
    await redis.delPlayer(clientID);
    await redis.delPlayer(player.enemyClientID);
}

// 正常結束遊戲
const endGame = async (client) => {
    const clientID = client.id;
    const player = await getPlayer(clientID);
    const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));

    let winner, loser, isTie = false;
    if (player.hp > enemy.hp) {
        winner = player;
        loser = enemy;
    } else if (player.hp === enemy.hp) {
        winner = player;
        loser = enemy;
        isTie = true;
    } else {
        winner = enemy;
        loser = player;
    }

    // game record
    await gameRecord(winner, loser, isTie);
    // send data
    const data = { winner: winner.userID, 'reason': 'END_GAME' };
    client.emit(event, JSON.stringify({ ...RESULT, data }));
    client.to(player.enemyClientID).emit(event, JSON.stringify({ ...RESULT, data }));
    await redis.delPlayer(clientID);
    await redis.delPlayer(player.enemyClientID);
}

const COMMAND = {
    INIT: init,            // 初始化遊戲
    // TAKE_CARD: takeCard,   // 抽牌(改為自動抽牌)
    PUT_CARD: putCard,     // 出牌
    ASSERT: assert,        // 卡牌動作
    END_TURN: endTurn,     // 結束這回合
    SURRENDER: surrender,  // 投降
}


/**
 * {
 *     cmd: 'ASSERT',
 *     data: {
 *         card: 'UUID',
 *         attack: {
 *             target: 'UUID'
 *         }
 *     }
 * }
 */


module.exports = function (client) {
    client.on(event, async (message) => {
        console.log(client.id, event);
        const clientID = client.id;
        const playerJSON = await redis.getPlayer(clientID);

        // Check token is valid
        try {
            await auth(client.handshake);
        } catch (err) {
            client.emit(event, JSON.stringify(NO_AUTH));
            return;
        }

        try {
            console.log('====================input====================');
            console.log(JSON.parse(message))
            console.log('=============================================');

            // check player in game
            if (playerJSON === undefined) {
                throw new Error('player not in the game');
            }

            const {
                cmd,
                data
            } = JSON.parse(message);

            // invalid command
            if (COMMAND[cmd] === undefined) {
                throw new Error('INVALID_COMMAND');
            }

            // run command
            await COMMAND[cmd](client, data);

        } catch (err) {
            console.error(err);
            client.emit(event, JSON.stringify(ERROR));
        }
    })

    client.on('disconnect', async () => {
        const clientID = client.id;
        // send to enemy quit message
        const playerJSON = await redis.getPlayer(clientID);
        if (playerJSON !== undefined) {
            const player = JSON.parse(playerJSON);
            const enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
            // game record
            await gameRecord(enemy, player, false);
            // send data
            client.to(player.enemyClientID).emit(event, JSON.stringify({ ...RESULT, 'data': { 'winner': enemy.userID, 'reason': 'QUIT' } }));
            // kill enemy
            await redis.delPlayer(player.enemyClientID);
        }
        // kill player
        await redis.delPlayer(clientID);
        client.disconnect();
    })
}
const auth = require('../../models/auth');
const redis = require('../../models/redis');
const Deck = require('../../models/deck');
const { sleep } = require('../../models/util');
const event = "mainGame";

const GAME_INFO = { "state": 200, "msg": "GAME_INFO", "data": {} };
const RESULT = { "state": 200, "msg": "GAME_OVER", "data": {} };
const NO_AUTH = { "state": 401, "msg": "TOKEN_NOT_GOOD", "data": null };
const ERROR = { "state": 500, "msg": "INTERNAL_SERVER_ERROR", "data": null };

const COMMAND = {
    INIT: 0,
    TAKE_CARD: 1,
    PUT_CARD: 2,
    ASSERT: 3,
    SURRENDER: 4
}

const HP = 4000;

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

const getPlayerResult = async (player) => {
    let enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
    const res = {
        'currentPlayer': player.currentPlayer,
        'self': {
            boardCards: player.boardCards,
            handCards: player.handCards,
            remainingCardsNumber: player.remainingCards.length,
            hp: player.hp,
        },
        'enemy': {
            boardCards: enemy.boardCards,
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

        // check player in game
        if (playerJSON === undefined) {
            client.emit(event, JSON.stringify(ERROR));
            return;
        }

        try {
            const {
                cmd,
                data
            } = JSON.parse(message);
            const sessionID = client.handshake.headers['session-id'];
            const session = JSON.parse(await redis.getSess(sessionID));
            const player = JSON.parse(playerJSON);

            console.log('====================input====================');
            console.log(JSON.parse(message))
            console.log('=============================================');

            // invalid command
            if (COMMAND[cmd] === undefined) {
                client.emit(event, JSON.stringify({ ...ERROR, 'msg': 'INVALID_COMMAND' }));
                return
            }

            // init table
            if (cmd === 'INIT' && !player.init) {
                const deck = await Deck.get({ ID: data.deck });
                player.userID = session.userID;
                player.remainingCards = deck.Cards;
                player.boardCards = [];
                player.handCards = [];
                player.hp = HP;
                player.init = true;
                // 起手三張牌
                for (let i = 0 ; i < 3 ; i++) {
                    const random = Math.floor(Math.random() * player.remainingCards.length);
                    const card = player.remainingCards.splice(random, 1); // 抽出並移除原本的牌
                    player.handCards = player.handCards.concat(card);
                }
                await redis.setPlayer(clientID, JSON.stringify(player));

                // 誰先init完，誰先開始
                let enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
                if (!enemy.init)
                    player.currentPlayer = player.userID
                else
                    player.currentPlayer = player.enemyUserID;

                // wait enemy init
                while (!enemy.init) {
                    console.log('wait enemy init');
                    enemy = JSON.parse(await redis.getPlayer(player.enemyClientID));
                    await sleep(1);
                }

                const res = await getPlayerResult(player);
                // send data
                console.log(JSON.stringify({ ...GAME_INFO, 'data': res }));
                client.emit(event, JSON.stringify({ ...GAME_INFO, 'data': res }));
                await redis.setPlayer(clientID, JSON.stringify(player));
                return;
            }

            if (cmd === 'TAKE_CARD') {
                const random = Math.floor(Math.random() * player.remainingCards.length);
                const card = player.remainingCards.splice(random, 1); // 抽出並移除原本的牌
                player.handCards = player.handCards.concat(card);
                // save data   
                await redis.setPlayer(clientID, JSON.stringify(player));
                // send data
                await sendDataToPlayerAndEnemy(client);
                return;
            }

            if (cmd === 'PUT_CARD') {

            }

            if (cmd === 'SURRENDER') {
                client.emit(event, JSON.stringify({ ...RESULT, 'data': { 'winner': player.enemyUserID, 'reason': 'SURRENDER' } }));
                client.to(player.enemyClientID).emit(event, JSON.stringify({ ...RESULT, 'data': { 'winner': player.enemyUserID, 'reason': 'SURRENDER' } }));
                await redis.delPlayer(player.enemyClientID);
                await redis.delPlayer(clientID);
                return
            }
        } catch (err) {
            console.error(err);
            client.emit(event, JSON.stringify({ ...ERROR }));
        }
    })

    client.on('disconnect', async (res) => {
        const clientID = client.id;
        // send to enemy quit message
        const playerJSON = await redis.getPlayer(clientID);
        if (playerJSON !== undefined) {
            const player = JSON.parse(playerJSON);
            client.to(player.enemyClientID).emit(event, JSON.stringify({ ...RESULT, 'data': { 'winner': player.enemyUserID, 'reason': 'QUIT' } }));
            // kill enemy
            await redis.delPlayer(player.enemyClientID);
        }
        // kill self
        await redis.delPlayer(clientID);
        client.disconnect();
    })
}
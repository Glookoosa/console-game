/**
 * Made by Swrdika
 * Version: 1.0
 * 
 * https://github.com/Swrdika/console-game
 */

const fs = require('fs');
const readlineSync = require('readline-sync');

let playerPositionX;
let playerPositionY;
var level = 1;
let blocks;
let exitData;
let npcData;
let fieldWidth;
let fieldHeight;

function readLevel(levelNumber) {
    try {
        const data = fs.readFileSync(`level/level${levelNumber}.json`, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error at reading files: ', err);
        return null;
    }
}

function backpackUser() {
    try {
        const data = fs.readFileSync('./backpack.json', 'utf8')
        return JSON.parse(data);
    } catch (err) {
        console.log(err);
    }
}

function initLevelData(levelData) {
    const { playerSpawn, worldBorder, blocks: levelBlocks, exit: levelExit, NPCs } = levelData;
    playerPositionX = playerSpawn.x;
    playerPositionY = playerSpawn.y;
    fieldWidth = worldBorder.width;
    fieldHeight = worldBorder.height;
    blocks = levelBlocks || [];
    npcData = NPCs || [];
    exitData = levelExit || {};
}

function drawField() {
    console.clear();
    let borderRow = '+';
    for (let i = 0; i < fieldWidth; i++) {
        borderRow += '-';
    }
    borderRow += '+';
    console.log(borderRow);


    for (let y = 0; y < fieldHeight; y++) {
        let fieldRow = '|';
        let isNearNPC = false;
        let isNearExit = false;
        let interactionMessage = '';

        for (let x = 0; x < fieldWidth; x++) {
            const isPlayer = x === playerPositionX && y === playerPositionY;
            const isBlock = blocks.some(block => block.x === x && block.y === y);
            const isNPC = npcData.some(npc => npc.x === x && npc.y === y);
            const isExit = x === exitData.x && y === exitData.y;

            if (isPlayer) {
                fieldRow += '𖨆';
            } else if (isBlock) {
                fieldRow += 'B';
            } else if (isNPC) {
                fieldRow += '𖨆';
                isNearNPC = true;
            } else if (isExit) {
                fieldRow += '𓉞';
                isNearExit = true;
            } else {
                fieldRow += ' ';
            }

            if (isNearNPC && Math.abs(playerPositionX - x) <= 1 && Math.abs(playerPositionY - y) <= 1) {
                interactionMessage = '| (Press E to interact with NPC)';
            } else if (playerPositionX === exitData.x && playerPositionY === exitData.y) {
                interactionMessage = '| (Press E to Exit)\x1b[0m';
            }
        }

        fieldRow += interactionMessage;
        fieldRow += '|';
        console.log(fieldRow);
    }

    console.log(borderRow);

    console.log('\x1b[37mInventory:');
    const inventory = backpackUser().userItems[0];
    for (const item in inventory) {
        console.log(`\x1b[37m- ${item}: ${inventory[item]}`);
    }
}


function isNearExit() {
    return playerPositionX === exitData.x && playerPositionY === exitData.y;
}

function interactWithNPC() {
    const npcInRange = npcData.some(npc => Math.abs(playerPositionX - npc.x) <= 1 && Math.abs(playerPositionY - npc.y) <= 1);
    if (npcInRange) {
        const nearbyNPC = npcData.find(npc => Math.abs(playerPositionX - npc.x) <= 1 && Math.abs(playerPositionY - npc.y) <= 1);
        console.log(nearbyNPC.dialogue);
    }
}

function interactWithExit() {
    if (isNearExit()) {
        const exitCodeInput = readlineSync.question('Enter the exit code: ');
        if (exitCodeInput === exitData.answer) {
            console.log('Congratulations! You have entered the correct exit code.');
            level++;
            const nextLevelData = readLevel(level);
            if (nextLevelData) {
                initLevelData(nextLevelData);
                drawField();
            } else {
                console.log('No more levels available. Game Over.');
                process.exit();
            }
        } else {
            console.log('Wrong exit code. You cannot exit at this time.');
        }
    } else {
        console.log('You are not near the exit.');
    }
}


function movePlayer(direction) {
    let nextPositionX = playerPositionX;
    let nextPositionY = playerPositionY;

    if (direction === 'w' || direction === '\u001B[A') { // Up arrow key
        nextPositionY--;
    } else if (direction === 's' || direction === '\u001B[B') { // Down arrow key
        nextPositionY++;
    } else if (direction === 'a' || direction === '\u001B[D') { // Left arrow key
        nextPositionX--;
    } else if (direction === 'd' || direction === '\u001B[C') { // Right arrow key
        nextPositionX++;
    } else if (direction === 'q') {
        console.log(`Thanks For Playing :)`);
        process.exit();
    } else if (direction === 'e') {
        const npcInRange = npcData.some(npc => Math.abs(playerPositionX - npc.x) <= 1 && Math.abs(playerPositionY - npc.y) <= 1);
        if (npcInRange) {
            interactWithNPC();
            return;
        }

        const isNearExit = (playerPositionX === exitData.x && playerPositionY === exitData.y);
        if (isNearExit) {
            interactWithExit();
            return;
        }
    }

    const isBlock = blocks.some(block => block.x === nextPositionX && block.y === nextPositionY);
    const isOutsideField = nextPositionX < 0 || nextPositionX >= fieldWidth || nextPositionY < 0 || nextPositionY >= fieldHeight;
    if (!isBlock && !isOutsideField) {
        playerPositionX = nextPositionX;
        playerPositionY = nextPositionY;
    }

    drawField();
}

function startGame() {
    const levelData = readLevel(level);
    if (!levelData) {
        console.error('Level File not found.')
        process.exit(1)
    }
    initLevelData(levelData)
    drawField()
    while (true) {
        const input = readlineSync.keyIn('', { hideEchoBack: true, mask: '', limit: 'wsadqem' })
        movePlayer(input)
    }
}


startGame();
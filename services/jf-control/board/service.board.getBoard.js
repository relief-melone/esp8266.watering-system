const connect = require('./service.board.connect');

async function getBoard() {
    return await connect();
}

module.exports = getBoard;
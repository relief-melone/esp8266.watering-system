const BoardService = require('../../services/jf-control/service.board');

const initBoard = async (req, res) => {
    let {Ip, Hostname, Port}  = req.body;

    try{
        let boardInitialized = await BoardService.connect(Hostname, Port, Ip);
        res.status(200).send({msg: "Board Initialized"});
    } catch (err) {
        res.status(500).send({msg: "Board could not be initialized"});
    }
}

module.exports = initBoard;
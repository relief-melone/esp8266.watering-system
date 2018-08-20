const BoardNotInitailized = Details => {
    this.code = 428;
    this.msg = "Board is not intialized yet";
    if(Details) this.details = Details;
}

module.exports = {
    BoardNotInitailized
}
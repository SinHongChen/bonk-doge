exports.up = function (knex) {
    return Promise.all([
        knex.raw('DROP PROCEDURE IF EXISTS Calc_Rank'),
        knex.raw('DROP TRIGGER IF EXISTS Tr_Insert_Game_Record'),
        knex.raw('DROP TRIGGER IF EXISTS Tr_Update_Game_Record'),
        knex.raw('DROP TRIGGER IF EXISTS Tr_Delete_Game_Record'),
    ]).then(() => {
        const config = knex.context.client.config;
        return knex.raw(`
CREATE DEFINER=${'`' + config.connection.user + '`'}@${'`%`'} PROCEDURE ${'`' + config.connection.database + '`'}.${'`Calc_Rank`'}()
BEGIN
DECLARE UserID INT;
DECLARE VictoryCount INT;
DECLARE DefeatCount INT;
DECLARE done BOOLEAN DEFAULT FALSE;
DECLARE CUR CURSOR FOR SELECT ID FROM Users;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done := TRUE;

OPEN CUR;

UserLoop: LOOP
	FETCH CUR INTO UserID;
    IF done THEN
      LEAVE UserLoop;
    END IF;
    
    SET VictoryCount = (SELECT COUNT(ID) FROM Game_Record WHERE Winner = UserID GROUP BY Winner);
    SET DefeatCount = (SELECT COUNT(ID) FROM Game_Record WHERE Loser = UserID GROUP BY Loser);
    UPDATE Users SET Victory = IFNULL(VictoryCount, 0), Defeat = IFNULL(DefeatCount, 0) WHERE ID = UserID;
END LOOP UserLoop;

CLOSE CUR;

END    `);
    }).then(() => {
        return Promise.all([
            knex.raw(`
CREATE DEFINER=${'`' + process.env.MYSQL_USER + '`'}@${'`%`'} TRIGGER ${'`Tr_Insert_Game_Record`'} AFTER INSERT ON ${'`Game_Record`'} FOR EACH ROW
BEGIN
CALL Calc_Rank();
END;        `),
            knex.raw(`
CREATE DEFINER=${'`' + process.env.MYSQL_USER + '`'}@${'`%`'} TRIGGER ${'`Tr_Update_Game_Record`'} AFTER UPDATE ON ${'`Game_Record`'} FOR EACH ROW
BEGIN
CALL Calc_Rank();
END;        `),
            knex.raw(`
CREATE DEFINER=${'`' + process.env.MYSQL_USER + '`'}@${'`%`'} TRIGGER ${'`Tr_Delete_Game_Record`'} AFTER DELETE ON ${'`Game_Record`'} FOR EACH ROW
BEGIN
CALL Calc_Rank();
END;        `),
        ]);
    });
};

exports.down = function (knex) {
    return Promise.all([
        knex.raw('DROP TRIGGER IF EXISTS Tr_Insert_Game_Record'),
        knex.raw('DROP TRIGGER IF EXISTS Tr_Update_Game_Record'),
        knex.raw('DROP TRIGGER IF EXISTS Tr_Delete_Game_Record'),
        knex.raw('DROP PROCEDURE IF EXISTS Calc_Rank'),
    ]);
};

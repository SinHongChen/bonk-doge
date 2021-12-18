exports.up = function (knex) {
    return knex.schema.hasTable('Decks').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Decks', table => {
                table.increments('ID');
                table.text('Cards','longtext').notNullable().comment('卡牌陣列(JSON)');
                table.comment('牌組');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Decks');
};

exports.up = function (knex) {
    return knex.schema.hasTable('Decks').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Decks', table => {
                table.increments('ID');
                table.integer('User_ID').notNullable().unsigned().references('ID').inTable('Users').comment('使用者');
                table.string('Name', 255).notNullable().comment('名稱');
                table.text('Cards','longtext').notNullable().comment('卡牌陣列(JSON)');
                table.comment('牌組');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Decks');
};

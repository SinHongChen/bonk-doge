exports.up = function (knex) {
    return knex.schema.hasTable('Races').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Races', table => {
                table.increments('ID');
                table.string('Name', 255).notNullable().comment('種族名稱');
                table.comment('卡牌種族');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Races');
};

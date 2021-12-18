exports.up = function (knex) {
    return knex.schema.hasTable('Natures').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Natures', table => {
                table.increments('ID');
                table.string('Name', 255).notNullable().comment('性質名稱');
                table.comment('卡牌性質');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Natures');
};

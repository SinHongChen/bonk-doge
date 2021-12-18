exports.up = function (knex) {
    return knex.schema.hasTable('Attributes').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Attributes', table => {
                table.increments('ID');
                table.string('Name', 255).notNullable().comment('屬性名稱');
                table.comment('卡牌屬性');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Attributes');
};

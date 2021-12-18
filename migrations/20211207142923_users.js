exports.up = function (knex) {
    return knex.schema.hasTable('Users').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Users', table => {
                table.increments('ID');
                table.string('Email', 255).notNullable().comment('信箱');
                table.string('Name', 255).notNullable().comment('名稱');
                table.integer('Victory').notNullable().defaultTo(0).comment('勝利數');
                table.integer('Defeat').notNullable().defaultTo(0).comment('失敗數');
                table.comment('使用者');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Users');
};

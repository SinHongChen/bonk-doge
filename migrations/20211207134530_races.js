exports.up = function (knex) {
    return knex.schema.createTable('Races', table => {
        table.increments('ID');
        table.string('Name', 255).notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('Races');
};

exports.up = function (knex) {
    return knex.schema.createTable('Attributes', table => {
        table.increments('ID');
        table.string('Name', 255).notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('Attributes');
};

exports.up = function (knex) {
    return knex.schema.createTable('Users', table => {
        table.increments('ID');
        table.string('Email', 255).notNullable();
        table.string('Name', 255).notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('Users');
};

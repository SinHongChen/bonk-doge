exports.up = function (knex) {
    return knex.schema.createTable('Role_Card', table => {
        table.increments('ID');
        table.string('Name', 255).notNullable();
        table.integer('Attribute_ID').notNullable().unsigned().references('ID').inTable('Attributes');
        table.integer('Star').notNullable();
        table.integer('Race_ID').notNullable().unsigned().references('ID').inTable('Races');
        table.text('Effect_Assert','longtext').nullable();
        table.text('Effect_Description','longtext').nullable();
        table.integer('Attack').notNullable();
        table.integer('Defense').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('Role_Card');
};

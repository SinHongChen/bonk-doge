exports.up = function (knex) {
    return knex.schema.createTable('Effect_Card', table => {
        table.increments('ID');
        table.string('Name', 255).notNullable();
        table.string('Img', 255).notNullable();
        table.integer('Nature_ID').notNullable().unsigned().references('ID').inTable('Natures');
        table.text('Effect_Assert','longtext').nullable();
        table.text('Effect_Description','longtext').nullable();
        table.uuid('UUID').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('Effect_Card');
};

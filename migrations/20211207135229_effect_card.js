exports.up = function (knex) {
    return knex.schema.hasTable('Effect_Card').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Effect_Card', table => {
                table.increments('ID');
                table.string('Name', 255).notNullable().comment('名稱');
                table.string('Img', 255).notNullable().comment('圖片');
                table.integer('Nature_ID').notNullable().unsigned().references('ID').inTable('Natures').comment('性質');
                table.text('Effect_Assert','longtext').nullable().comment('效果定義(JSON)');
                table.text('Effect_Description','longtext').nullable().comment('效果描述');
                table.uuid('UUID').notNullable();
                table.comment('效果卡');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Effect_Card');
};

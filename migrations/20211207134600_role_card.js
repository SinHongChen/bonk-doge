exports.up = function (knex) {
    return knex.schema.hasTable('Role_Card').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Role_Card', table => {
                table.increments('ID');
                table.string('Name', 255).notNullable().comment('名稱');
                table.string('Img', 255).notNullable().comment('圖片');
                table.integer('Attribute_ID').notNullable().unsigned().references('ID').inTable('Attributes').comment('屬性');
                table.integer('Star').notNullable().comment('星數');
                table.integer('Race_ID').notNullable().unsigned().references('ID').inTable('Races').comment('種族');
                table.text('Effect_Assert','longtext').nullable().comment('效果定義(JSON)');
                table.text('Effect_Description','longtext').nullable().comment('效果描述');
                table.integer('Attack').notNullable().comment('攻擊力');
                table.integer('Defense').notNullable().comment('防禦力');
                table.uuid('UUID').notNullable();
                table.comment('角色卡');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Role_Card');
};

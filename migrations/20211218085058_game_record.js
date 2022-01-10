exports.up = function (knex) {
    return knex.schema.hasTable('Game_Record').then(exists => {
        if (!exists) {
            return knex.schema.createTable('Game_Record', table => {
                table.increments('ID');
                table.integer('Winner').notNullable().unsigned().references('ID').inTable('Users').comment('勝者');
                table.integer('Loser').notNullable().unsigned().references('ID').inTable('Users').comment('輸者');
                table.boolean('IsTie').notNullable().defaultTo(false).comment('是否平手');
                table.text('Winner_Cards','longtext').notNullable().comment('勝者卡牌');
                table.text('Loser_Cards','longtext').notNullable().comment('輸者卡牌');
                table.integer('Total_Time').notNullable().defaultTo(0).comment('總時間(分鐘)');
                table.datetime('Created_Date').defaultTo(knex.fn.now()).comment('建立時間');
                table.comment('比賽紀錄');
            });
        }
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('Game_Record');
};

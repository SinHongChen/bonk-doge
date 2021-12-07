const db = require('./db.js');

const self = module.exports = {
    insert: (table, createInfo = {}) => {
        return db(table)
            .insert(createInfo)
            .then(result => self.select(table, { ID: result[0] }).then(results => results[0]))
            .catch(err => {
                console.log(err);
                return `INSERT_${table.toUpperCase()}_ERROR`;
            })
    },
    select: (table, whereInfo = {}, selectInfo = undefined) => {
        return db(table)
            .select(selectInfo !== undefined ? selectInfo : '*')
            .where(whereInfo)
            .then(result => result)
            .catch(err => {
                console.log(err);
                return `SELECT_${table.toUpperCase()}_ERROR`;
            })
    },
    update: (table, whereInfo = {}, updateInfo = {}) => {
        return db(table)
            .update(updateInfo)
            .where(whereInfo)
            .then(result => self.select(table, { whereInfo: { ID: result[0] } }).then(results => results[0]))
            .catch(err => {
                console.log(err);
                return `UPDATE_${table.toUpperCase()}_ERROR`;
            })
    },
    delete: (table, whereInfo = {}) => {
        return db(table)
            .delete()
            .where(whereInfo)
            .then(() => `${table.toUpperCase()}_DELETED`)
            .catch(err => {
                console.log(err);
                return `DELETE_${table.toUpperCase()}_ERROR`;
            })
    }
}
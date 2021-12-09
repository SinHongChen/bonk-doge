const db = require('./db.js');

const self = module.exports = {
    insert: (table, insertInfo = {}) => {
        return db(table)
            .insert(insertInfo)
            .then(result => self.get('Users', result[0]))
            .catch(err => {
                console.log(err);
                return new Error(`INSERT_${table.toUpperCase()}_ERROR`);
            })
    },
    select: (table, { selectInfo, whereInfo } = {}) => {
        return db(table)
            .select(selectInfo !== undefined ? selectInfo : '*')
            .where(whereInfo !== undefined ? whereInfo : {})
            .then(result => result)
            .catch(err => {
                console.log(err);
                return new Error(`SELECT_${table.toUpperCase()}_ERROR`);
            })
    },
    get: (table, ID) => {
        return db(table)
            .select('*')
            .where({ ID })
            .then(results => results[0])
            .catch(err => {
                console.log(err);
                return new Error(`GET_${table.toUpperCase()}_ERROR`);
            })
    },
    update: async (table, { updateInfo, whereInfo } = {}) => {
        return db(table)
            .update(updateInfo !== undefined ? updateInfo : {})
            .where(whereInfo !== undefined ? whereInfo : {})
            .then(() => self.get('Users', whereInfo.ID))
            .catch(err => {
                console.log(err);
                return new Error(`UPDATE_${table.toUpperCase()}_ERROR`);
            })
    },
    delete: (table, whereInfo = {}) => {
        return db(table)
            .delete()
            .where(whereInfo)
            .then(() => `${table.toUpperCase()}_DELETED`)
            .catch(err => {
                console.log(err);
                return new Error(`DELETE_${table.toUpperCase()}_ERROR`);
            })
    }
}
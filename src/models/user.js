let id = 1;
const users = [
    {
        id: 1,
        name: 'jack',
        email: 'jack2316006@gmail.com'
    }
]

var self = module.exports = {
    create: ({ name, email }) => {
        return new Promise((resolve, reject) => {
            const user = {
                id: ++id,
                name,
                email
            }
            users.push(user);
            resolve(user);
        })
    },
    list: () => {
        return new Promise((resolve, reject) => {
            resolve(users);
        })
    },
    get: (id) => {
        return new Promise((resolve, reject) => {
            const find = users.find(user => user.id == id);
            if (find)
                resolve(find);
            else
                reject('USER_NOT_FOUND');
        })
    },
    update: ({ id, name, email }) => {
        return new Promise((resolve, reject) => {
            self.get(id).then(user => {
                const index = users.findIndex(user => user.id == id);
                users[index].name = name ? name : user.name;
                users[index].email = email ? email : user.email;
                resolve(users[index]);
            }).catch(err => reject(err))
        })
    },
    delete: (id) => {
        return new Promise((resolve, reject) => {
            const index = users.findIndex(user => user.id == id);
            if (index < 0)
                reject('USER_NOT_FOUND');
            else {
                users.splice(index, 1);
                resolve({ id });
            }
        })
    }
}
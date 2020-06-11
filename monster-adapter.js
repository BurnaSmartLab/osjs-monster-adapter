/*
For more information about vfs adapters, visit:
- https://manual.os-js.org/v3/tutorial/vfs/
- https://manual.os-js.org/v3/guide/filesystem/
- https://manual.os-js.org/v3/development/
*/
const Monster = require('./src/Monster');

const mapFile = (containers) => item => ({
    isDirectory: true,
    isFile: false,
    filename: item.name,
    path: item.name
})
const readdir = (monster, mon) => {
    return mon.accountDetails('application/json').then(result => {
        //console.log(result)
        return JSON.parse(result.message).map(container => ({
            isDirectory: true,
            isFile: false,
            filename: container.name,
            path: monster + container.name,
            mime: null,
            size: container.bytes
        }))
    });
    /*return Promise.resolve([{
        path:'milad',
        isDirectory:true,
        isFile:false,
        filename:'Miladddd'},
        {
            path:'morteza',
            isDirectory:true,
            isFile:false,
            filename:'Morteza'}
    ])*/
}
module.exports = (core) => {
    const mon = new Monster("http://localhost:8080/auth/v1.0")
    mon.login('test:tester', 'testing')
    return {
        readdir: vfs => (monster) => readdir(monster, mon)
        // readdir: vfs => (path) => Promise.resolve([{
        //     path:'milad',
        //     isDirectory:true,
        //     isFile:false,
        //     filename:'Milad'},
        //     {
        //         path:'morteza',
        //         isDirectory:true,
        //         isFile:false,
        //         filename:'Morteza'}
        // ])
    }
};

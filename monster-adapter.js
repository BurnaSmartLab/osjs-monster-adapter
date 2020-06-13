/*
For more information about vfs adapters, visit:
- https://manual.os-js.org/v3/tutorial/vfs/
- https://manual.os-js.org/v3/guide/filesystem/
- https://manual.os-js.org/v3/development/
*/
const Monster = require('./src/Monster');
var http = require('http');
const fetch = require('node-fetch')

const mapFile = (containers) => item => ({
    isDirectory: true,
    isFile: false,
    filename: item.name,
    path: item.name
})
const readdir = (monster, mon) => {
    console.log(mon.x_storage_token)
    console.log(mon.x_storage_url)
    /// http
    /*let options = {
        host: 'localhost',
        path: '/v1/AUTH_test',
        headers: {'X-Auth-Token': 'AUTH_tkfc92ea092346426990df0207c66194c3','Accept': 'application/json'},
        //since we are listening on a custom port, we need to specify it by hand
        port: '12345',
        //This is what changes the request to a POST request
        method: 'GET'
    };

    callback = function(response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            let test = JSON.parse(str).map(container => ({
                isDirectory: true,
                isFile: false,
                filename: container.name,
                path: monster + container.name,
                mime: null,
                size: container.bytes
            }))
            console.log(test)
        });
    }

    var req = http.request(options, callback);
    req.end()*/

    return (async () => {
        try {
            const response = await fetch("http://127.0.0.1:12345/v1/AUTH_test",{headers:{
                    'X-Auth-Token': 'AUTH_tkfc92ea092346426990df0207c66194c3',
                    'Accept': 'application/json'
                }});
            const containers = await response.json();
            const test = await containers.map(container => ({
                isDirectory: true,
                isFile: false,
                filename: container.name,
                path: monster + container.name,
                mime: null,
                size: container.bytes
            }))
            return test
        } catch (error) {
            return [];
        }
    })()

    /*return mon.accountDetails('application/json').then(result => {
        if (result.status === 200){
            console.log(result.message)
            return JSON.parse(result.message).map(container => ({
                isDirectory: true,
                isFile: false,
                filename: container.name,
                path: monster + container.name,
                mime: null,
                size: container.bytes
            }))
        }
        else {
            console.log(result)
            return []
        }
    });*/
}
module.exports = (core) => {
    const mon = new Monster("http://localhost:12345/auth/v1.0")
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

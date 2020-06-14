/*
For more information about vfs adapters, visit:
- https://manual.os-js.org/v3/tutorial/vfs/
- https://manual.os-js.org/v3/guide/filesystem/
- https://manual.os-js.org/v3/development/
*/
const path = require('path')

const Monster = require('./src/Monster');

////check if path is at mountpoint
const checkMountPoint = dir => dir.split(':/').splice(1).join(':/')


///get container name
const containerName = dir => dir.split('/').splice(1,1)

const readdir = (monster, mon) => {

    /////if checkMountPoint be empty it show us we are at root and need call accountDetails api
    ////else we must list a contaienr objects or objects in a folder
    if (checkMountPoint(monster) === '') {
        return mon.accountDetails('application/json').then(result => {
            if (result.status === 200) {
                return JSON.parse(result.message).map(container => ({
                    isDirectory: true,
                    isFile: false,
                    filename: container.name,
                    path: monster + container.name,
                    mime: null,
                    size: container.bytes
                }))
            } else {
                return []
            }
        });
    } else {
        return mon.getContainerObjectDetails(containerName(monster), 'application/json', 'swift-ui2/').then(result => {
            if (result.status === 200) {
                console.log(result.message)
                return JSON.parse(result.message).map(file => {
                    if(file.subdir){
                        return {
                            isDirectory: true,
                            isFile: false,
                            filename: file.subdir,
                            path: monster + '/' + file.subdir,
                            mime: null
                        }
                    }else {
                        return {
                            isDirectory: false,
                            isFile: true,
                            filename: path.basename(file.name),
                            path: monster + '/' + file.name,
                            mime: file.content_type,
                            size: file.bytes
                        }
                    }
                })
            } else {
                return []
            }
        });
    }

}
module.exports = (core) => {
    const mon = new Monster("http://localhost:12345/auth/v1.0")
    mon.login('test:tester', 'testing')
    core.on('osjs/core:destroy', () => mon.destroy());
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

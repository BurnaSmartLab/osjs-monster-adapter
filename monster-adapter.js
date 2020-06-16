/*
For more information about vfs adapters, visit:
- https://manual.os-js.org/v3/tutorial/vfs/
- https://manual.os-js.org/v3/guide/filesystem/
- https://manual.os-js.org/v3/development/
*/

/*
* TODO: Code refactoring
*
* */
const path = require('path')

const Monster = require('./src/Monster');

////check if path is at mountpoint(root)
const checkMountPoint = dir => dir.split(':/').splice(1).join(':/')


///get container name
const containerName = dir => dir.split('/').splice(1, 1)[0]

///get directory name from root path
const prefix = dir => dir.split('/').splice(2).join('/')

//keep path from pount point to container name
const clearPath = dir => dir.split('/').splice(0, 2).join('/')

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
        return mon.getContainerObjectDetails(containerName(monster), 'application/json', prefix(monster)).then(result => {
            if (result.status === 200) {
                return JSON.parse(result.message).map(file => {
                    if (file.subdir) {
                        return {
                            isDirectory: true,
                            isFile: false,
                            filename: path.basename(file.subdir),
                            path: clearPath(monster) + '/' + file.subdir,
                            mime: null
                        }
                    } else {
                        return {
                            isDirectory: file.content_type === 'application/directory',
                            isFile: file.content_type !== 'application/directory',
                            filename: path.basename(file.name),
                            path: file.content_type !== 'application/directory'?clearPath(monster) + '/' + file.name:clearPath(monster) + '/' + file.name+'/',
                            mime: file.content_type !== 'application/directory'? file.content_type: null,
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

const mkdir = (monster, mon) => {
    /*
    * DESCRIPTION:
    * this function create container or directory according to path.
    *
    * example 1: myMonster:/newDirectory is at container position we must get 'newDirectory' and add it to monster as
    * container.
    *
    * example 2: myMonster:/newDirectory/somDirectory is in 'newDirectory' container and we must add 'someDirectory' as
    * a directory of container
    * */

    const container = containerName(monster)
    if (monster.split('/').length === 2) {
        mon.createContainer(container)
    } else {
        let metadatas = new Map()
        metadatas.set("Content-Type", "application/directory")
        let test = monster.split('/').splice(2).join('/')
        console.log(test)
        mon.createObject(container, monster.split('/').splice(2).join('/'), metadatas)
    }
}

module.exports = (core) => {
    const mon = new Monster("http://localhost:12345/auth/v1.0")
    mon.login('test:tester', 'testing')

    return {
        readdir: vfs => (monster) => readdir(monster, mon),
        mkdir: vfs => (monster) => mkdir(monster, mon),
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

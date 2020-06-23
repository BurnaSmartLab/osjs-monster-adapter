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
const {Readable} = require('stream')
const fs = require('fs')

const Monster = require('./src/Monster')
////check if path is at mountpoint(root)
const checkMountPoint = dir => dir.split(':/').splice(1).join(':/')


///get container name
const containerName = dir => dir.split('/').splice(1, 1)[0]

///get directory name from root path
const prefix = dir => dir.split('/').splice(2).join('/')

///change mountpoint:/containername/object To /containername/object
const pathFromContainer = dir => dir.split(':').splice(1).join(':')

//keep path from mount point to container name
const clearPath = dir => dir.split('/').splice(0, 2).join('/')

//checking the current path to be in container list or not
const isContainerList = dir => dir.split('/').length === 2

///get object name
const objectName = dir => path.basename(dir)

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
                    mime: 'container',
                    size: container.bytes,
                    stat: {
                        mtime: container.last_modified
                    }
                }))
            } else {
                return []
            }
        });
    } else {
        return mon.getContainerObjectDetails(containerName(monster), 'application/json', prefix(monster)).then(result => {
            if (result.status === 200) {
                /*
                * DESCRIPTION:
                * first compute subdir sub list
                * then remove object that has same name with subdir object's name with 'application/content-type' content-type
                * at last map object to OS.js object
                * */
                let subdir = JSON.parse(result.message).filter(file => file.subdir)
                let clearedObjects = JSON.parse(result.message).filter(file => !subdir.some(value =>
                    ((typeof file.subdir === 'undefined') && (file.content_type === 'application/directory') && (value.subdir === `${file.name}/`)))
                )
                return clearedObjects.map(file => {
                    if (file.subdir) {
                        return {
                            isDirectory: true,
                            isFile: false,
                            filename: objectName(file.subdir),
                            path: clearPath(monster) + '/' + file.subdir,
                            mime: null
                        }
                    } else {
                        return {
                            isDirectory: file.content_type === 'application/directory',
                            isFile: file.content_type !== 'application/directory',
                            filename: objectName(file.name),
                            path: file.content_type !== 'application/directory' ? clearPath(monster) + '/' + file.name : clearPath(monster) + '/' + file.name + '/',
                            mime: file.content_type !== 'application/directory' ? file.content_type : null,
                            size: file.bytes,
                            stat: {
                                mtime: file.last_modified
                            }
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
    if (isContainerList(monster)) {
        mon.createContainer(container)
    } else {
        let metadatas = new Map()
        metadatas.set("Content-Type", "application/directory")
        mon.createObject(container, monster.split('/').splice(2).join('/'), metadatas);
    }
}

const readfile = (monster, options, mon) => {
    if (!options.hasOwnProperty('download')) {
        return mon.getObjectContent(containerName(monster), objectName(monster)).then(result => {
            if (result.status === 200) {
                const readable = Readable.from(result.message)
                return readable.on('end', chunk => chunk)
            } else {
                return `Error: ${result.status}`
            }
        });
    } else if (options.download) {
        return mon.getObjectContent(containerName(monster), objectName(monster)).then(result => {
            return result.message
        });
    }
}

const unlink = (monster, mon) => {
    /*
   * DESCRIPTION:
   * this function delete container or directory according to path.
   *
   * example 1: myMonster:/newDirectory is at container position we must delete 'newDirectory'
   *
   * example 2: myMonster:/newDirectory/someObject is in 'newDirectory' container and we must delete 'someObject    '
   * */

    const container = containerName(monster)
    if (isContainerList(monster)) {
        mon.removeContainer(container)
    } else {
        mon.removeObject(container, objectName(monster))
    }
}

const copy = (from, to, mon) => {
    /*
   * DESCRIPTION:
   * this function copy object from source to destination.
   *
   * example: copy someObject.obj in myMonster:/container1/some/Path/someObject.obj to myMonster:/container2/some/Path/someObject.obj
   * */

    if (!(isContainerList(from) && isContainerList(to))) {
        return mon.copyObject(pathFromContainer(from), pathFromContainer(to)).then(result=>result.status === 201)
    }
}

const rename = (from, to, mon) => {
    /*
   * DESCRIPTION:
   * this function move object from source to destination.
   *
   * example: copy someObject.obj in myMonster:/container1/some/Path/someObject.obj to myMonster:/container2/some/Path/someObject.obj
   * */

    if (!(isContainerList(from) && isContainerList(to))) {
        return mon.copyObject(pathFromContainer(from), pathFromContainer(to)).then(result =>{
            if (result.status===201){
                return mon.removeObject(containerName(from),objectName(from)).then(rmResult => rmResult.status === 204)
            }
        })
    }
}

module.exports = (core) => {
    const mon = new Monster("http://localhost:12345/auth/v1.0")
    mon.login('test:tester', 'testing')

    return {
        readdir: vfs => (monster) => readdir(monster, mon),
        mkdir: vfs => (monster) => mkdir(monster, mon),
        readfile: vfs => (monster, options) => readfile(monster, options, mon),
        unlink: vfs => (monster) => unlink(monster, mon),
        copy: vfs => (from, to) => copy(from, to, mon),
        rename: vfs => (from, to) => rename(from, to, mon),
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

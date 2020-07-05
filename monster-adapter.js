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
const Stream = require('stream').Transform
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
        return mon.getContainerObjectDetails(containerName(monster), 'application/json', '/', prefix(monster)).then(result => {
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
const mkdir = (monster, mon) => {
    const container = containerName(monster)
    if (isContainerList(monster)) {
        mon.createContainer(container)
    } else {
        let metadatas = new Map()
        metadatas.set("Content-Type", "application/directory")
        mon.createDirectory(container, monster.split('/').splice(2).join('/'), metadatas);
    }
}

const readfile = (monster, options, mon) => {
    return mon.getObjectContent(containerName(monster), objectName(monster)).then(result => result.message);
}

const writefile = (vfs, mon) => (path, data, options) => {
    if (isContainerList(path)) {
        return Promise.reject(new Error('Invalid destination (You can not upload in container list)'));
    }
    return mon.createObject(containerName(path), prefix(path), data).then(result => console.log(result));
}

/*
  * DESCRIPTION:
  * this function delete container or directory according to path.
  *
  * example 1: myMonster:/newDirectory is at container position we must delete 'newDirectory'
  *
  * example 2: myMonster:/newDirectory/someObject is in 'newDirectory' container and we must delete 'someObject'
* */
const unlink = (monster, mon) => {
    return (async () => {
        let objectPath
        let container = containerName(monster)
        let isContainer = isContainerList(monster)
        if ((monster.slice(-1) === '/') || isContainer) {
            //get sub objects of object we want delete it.
            await mon.getContainerObjectDetails(containerName(monster), 'application/json', '', prefix(monster)).then(
                async (result) => {
                    let objects = JSON.parse(result.message).map(object => object.name)
                    if (objects.length > 0) {
                        //sort object by path length
                        //objects.sort((a, b) => b.split('/').length - a.split('/').length)
                        //remove each object in array
                        for (let i = 0; i < objects.length; i++) {
                            await mon.removeObject(container, objects[i]).then(result => console.log(result))
                        }
                    }
                })
            if (isContainer) {
                return mon.removeContainer(container).then(result => console.log(result))
            } else {
                //remove '/' from end of directory we decide to delete it.
                objectPath = prefix(monster).slice(0, -1)
                return mon.removeObject(container, objectPath).then(result => console.log(result))
            }
        } else {
            objectPath = prefix(monster)
            return mon.removeObject(container, objectPath).then(result => console.log(result))
        }
    })()
}

/*
   * DESCRIPTION:
   * this function copy object from source to destination.
   *
   * example: copy someObject.obj in myMonster:/container1/some/Path/someObject.obj to myMonster:/container2/some/Path/someObject.obj
   * */
const copy = (from, to, mon) => {
    if (isContainerList(from)) {
        return Promise.reject(new Error('Invalid source (You can not COPY a container)'));
    } else if (isContainerList(to)) {
        return Promise.reject(new Error('Invalid destination (You can not COPY in container list)'));
    }

    let sourcePath = pathFromContainer(from)
    let destinationPath = pathFromContainer(to)
    return (async () => {
        if (from.slice(-1) === '/') {
            let fromContainerName = containerName(from)
            //get sub objects of object we want delete it.
            let objects = await mon.getContainerObjectDetails(fromContainerName, 'application/json', '', prefix(from)).then(
                result => JSON.parse(result.message).map(object => `/${fromContainerName}/${object.name}`))

            //slice(0,-1) removes '/' from end of directory we decide to delete it.
            //mon.copyObject(pathFromContainer(from).slice(0, -1), pathFromContainer(to)).then(result => console.log(result))
            if (objects.length > 0) {
                //sort object by path length
                objects.sort((a, b) => a.split('/').length - b.split('/').length)
                console.log(objects)
                //copy each object in array
                for (let i = 0; i < objects.length; i++) {
                    ///returns path where object must bu copied in destination
                    let exentionPath = objects[i].split(sourcePath).splice(1)
                    mon.copyObject(objects[i], `${destinationPath}/${exentionPath}`).then(result => console.log(result))
                }
            }
        } else {
            mon.copyObject(sourcePath, destinationPath).then(result => result)
        }
    })();
}

/*
  * DESCRIPTION:
  * this function move object from source to destination.
  *
  * example: copy someObject.obj in myMonster:/container1/some/Path/someObject.obj to myMonster:/container2/some/Path/someObject.obj
  * */
const rename = (from, to, options, mon) => {
    return (async () => {
        if (from.slice(-1) === '/') {
            let fromContainerName = containerName(from)
            //get sub objects of object we want delete it.
            let objects = await mon.getContainerObjectDetails(fromContainerName, 'application/json', '', prefix(from)).then(
                result => JSON.parse(result.message).map(object => `/${fromContainerName}/${object.name}`))

            //slice(0,-1) removes '/' from end of directory we decide to delete it.
            //mon.copyObject(pathFromContainer(from).slice(0, -1), pathFromContainer(to)).then(result => console.log(result))
            if (objects.length > 0) {
                //sort object by path length
                objects.sort((a, b) => a.split('/').length - b.split('/').length)
                console.log(objects)
                //copy each object in array
                for (let i = 0; i < objects.length; i++) {
                    ///returns path where object must bu copied in destination
                    let exentionPath = objects[i].split(sourcePath).splice(1)
                    mon.copyObject(objects[i], `${destinationPath}/${exentionPath}`).then(result => console.log(result))
                }
            }
        } else {
            mon.copyObject(sourcePath, destinationPath).then(result => result)
        }
        unlink(from, mon)
    })();

    /*if (!(isContainerList(from) && isContainerList(to))) {
        return mon.copyObject(pathFromContainer(from), pathFromContainer(to)).then(result => {
            if (result.status === 201) {
                return mon.removeObject(containerName(from), objectName(from)).then(rmResult => rmResult.status === 204)
            }
        })
    }*/
}

module.exports = (core) => {
    const mon = new Monster("http://localhost:12345/auth/v1.0")
    mon.login('test:tester', 'testing')

    return {
        readdir: vfs => (monster) => readdir(monster, mon),
        mkdir: vfs => (monster) => mkdir(monster, mon),
        readfile: vfs => (monster, options) => readfile(monster, options, mon),
        writefile: vfs => writefile(vfs, mon),
        unlink: vfs => (monster) => unlink(monster, mon),
        copy: vfs => (from, to) => copy(from, to, mon),
        rename: vfs => (from, to, options) => rename(from, to, options, mon),

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

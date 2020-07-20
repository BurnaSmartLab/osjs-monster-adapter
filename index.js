/*
 * OS.js - JavaScript Swift Adapter Desktop Platform
 *
 * Copyright (c) 2011-2020, BurnaSmartLab <javan.it@gmail.com, s.milad.hashemi@outlook.com, mortaza.biabani@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * @author  BurnaSmartLab <javan.it@gmail.com, s.milad.hashemi@outlook.com, mortaza.biabani@gmail.com>
 * @licence Simplified BSD License
 */
const path = require('path');

const Monster = require('./src/Monster');

// check if path is at mountpoint(root)
const checkMountPoint = dir => dir.split(':/').splice(1).join(':/');

// get container name
const containerName = dir => dir.split('/').splice(1, 1)[0];

// get directory name from root path
const prefix = dir => dir.split('/').splice(2).join('/');

// change mountpoint:/containername/object To /containername/object
const pathFromContainer = dir => dir.split(':').splice(1).join(':');

// keep path from mount point to container name
const clearPath = dir => dir.split('/').splice(0, 2).join('/');

// checking the current path to be in container list or not
const isContainerList = dir => dir.split('/').length === 2;

// get object name
const objectName = dir => path.basename(dir);

const readdir = (monster, mon) => {
// if checkMountPoint be empty it show us we are at root and need call accountDetails api
// else we must list a contaienr objects or objects in a folder
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
        }));
      } else {
        return [];
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
        let subdir = JSON.parse(result.message).filter(file => file.subdir);
        let clearedObjects = JSON.parse(result.message).filter(file => !subdir.some(value =>
          ((typeof file.subdir === 'undefined') && (file.content_type === 'application/directory') && (value.subdir === `${file.name}/`)))
        );
        return clearedObjects.map(file => {
          if (file.subdir) {
            return {
              isDirectory: true,
              isFile: false,
              filename: objectName(file.subdir),
              path: clearPath(monster) + '/' + file.subdir,
              mime: null
            };
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
            };
          }
        });
      } else {
        return [];
      }
    });
  }

};

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
  const container = containerName(monster);
  if (isContainerList(monster)) {
    mon.createContainer(container);
  } else {
    let metadatas = new Map();
    metadatas.set('Content-Type', 'application/directory');
    mon.createDirectory(container, monster.split('/').splice(2).join('/'), metadatas);
  }
};

const readfile = (monster, options, mon) => {
  return mon.getObjectContent(containerName(monster), prefix(monster)).then(result => result.message);
};

const writefile = (vfs, mon) => (path, data, options) => {
  if (isContainerList(path)) {
    return Promise.reject(new Error('Invalid destination (You can not upload in container list)'));
  }
  return mon.createObject(containerName(path), prefix(path), data).then(result => console.log(result));
};

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
    let objectPath;
    let container = containerName(monster);
    let isContainer = isContainerList(monster);
    if ((monster.slice(-1) === '/') || isContainer) {
      // get sub objects of object we want delete it.
      await mon.getContainerObjectDetails(containerName(monster), 'application/json', '', prefix(monster)).then(
        async (result) => {
          let objects = JSON.parse(result.message).map(object => object.name);
          if (objects.length > 0) {
            // remove each object in array
            for (let i = 0; i < objects.length; i++) {
              await mon.removeObject(container, objects[i]).then(result => console.log(result));
            }
          }
        });
      if (isContainer) {
        return mon.removeContainer(container).then(result => console.log(result));
      } else {
        // remove '/' from end of directory we decide to delete it.
        objectPath = prefix(monster).slice(0, -1);
        return mon.removeObject(container, objectPath).then(result => console.log(result));
      }
    } else {
      objectPath = prefix(monster);
      return mon.removeObject(container, objectPath).then(result => console.log(result));
    }
  })();
};

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

  let sourcePath = pathFromContainer(from);
  let destinationPath = pathFromContainer(to);
  return (async () => {
    if (from.slice(-1) === '/') {
      let fromContainerName = containerName(from);
      // get sub objects of object we want delete it.
      let objects = await mon.getContainerObjectDetails(fromContainerName, 'application/json', '', prefix(from)).then(
        result => JSON.parse(result.message).map(object => `/${fromContainerName}/${object.name}`));

      if (objects.length > 0) {
        // copy each object in array
        for (let i = 0; i < objects.length; i++) {
          // /returns path where object must bu copied in destination
          let exentionPath = objects[i].split(sourcePath).splice(1);
          mon.copyObject(objects[i], `${destinationPath}/${exentionPath}`).then(result => console.log(result));
        }
      }
      // slice(0,-1) removes '/' from end of directory we decide to copy it.
      return mon.copyObject(pathFromContainer(from).slice(0, -1), pathFromContainer(to)).then(result => console.log(result));
    } else {
      return mon.copyObject(sourcePath, destinationPath).then(result => result);
    }
  })();
};

/*
  * DESCRIPTION:
  * this function move object from source to destination.
  *
  * example: copy someObject.obj in myMonster:/container1/some/Path/someObject.obj to myMonster:/container2/some/Path/someObject.obj
  * */
const rename = (from, to, options, mon) => {
  if (isContainerList(from)) {
    return Promise.reject(new Error('Invalid source (You can not COPY a container)'));
  } else if (isContainerList(to)) {
    return Promise.reject(new Error('Invalid destination (You can not COPY in container list)'));
  }

  let sourcePath = pathFromContainer(from);
  let destinationPath = pathFromContainer(to);
  return (async () => {
    if (from.slice(-1) === '/') {
      let fromContainerName = containerName(from);
      // get sub objects of object we want delete it.
      let objects = await mon.getContainerObjectDetails(fromContainerName, 'application/json', '', prefix(from)).then(
        result => JSON.parse(result.message).map(object => `/${fromContainerName}/${object.name}`));

      if (objects.length > 0) {
        // copy each object in array
        for (let i = 0; i < objects.length; i++) {
          // /returns path where object must bu copied in destination
          let exentionPath = objects[i].split(sourcePath).splice(1);
          mon.copyObject(objects[i], `${destinationPath}/${exentionPath}`).then(result => console.log(result));
        }
      }
      // slice(0,-1) removes '/' from end of directory we decide to copy it.
      await mon.copyObject(pathFromContainer(from).slice(0, -1), pathFromContainer(to)).then(result => console.log(result));
    } else {
      await mon.copyObject(sourcePath, destinationPath).then(result => result);
    }
    await unlink(from, mon);
  })();
};

// Makes sure we can make a request with what we have
const before = vfs => {
  let swift = new Monster(vfs.mount.attributes.endpoint);
  return swift.login(vfs.mount.attributes.username, vfs.mount.attributes.password).then(() => swift);
};

module.exports = (core) => {
  return {
    readdir: vfs => (monster) => before(vfs).then((swift) => readdir(monster, swift)),
    mkdir: vfs => (monster) => before(vfs).then((swift) => mkdir(monster, swift)),
    readfile: vfs => (monster, options) => before(vfs).then((swift) => readfile(monster, options, swift)),
    writefile: vfs => (...args) => before(vfs).then((swift) => writefile(vfs, swift)(...args)),
    unlink: vfs => (monster) => before(vfs).then((swift) => unlink(monster, swift)),
    copy: vfs => (from, to) => before(vfs).then((swift) => copy(from, to, swift)),
    rename: vfs => (from, to, options) => before(vfs).then((swift) => rename(from, to, options, swift))
  };
};

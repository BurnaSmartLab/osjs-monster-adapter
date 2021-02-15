# OS.js SWIFT VFS Adapter

This is the SWIFT VFS (Server) Adapter for OS.js.

## Prerequisites
Install Openstack Swift All in One Deployment (SAIO) using this manual:

https://docs.openstack.org/swift/latest/development_saio.html
## Installation
There are two approaches to install **swift vfs adapter**:

#### 1. Installing by using source:
1- Go to below directory:

`cd src/server`

2- Create **vfs** directory:

`mkdir vfs`

3- Then go to **vfs** directory:

`cd vfs`

4- Clone adapter to this directory:

`git clone https://github.com/BurnaSmartLab/osjs-monster-adapter.git`

5- Then go to **osjs-monster-adapter** directory:

`cd osjs-monster-adapter`

6- At last use bellow command to install dependency:

`npm install`


#### 2. Installing using npm dependency manager:

Just execute bellow command:

`npm i @burna/osjs-monster-adapter`

## Usage

```javascript
// src/server/index.js

// If first approach for installing has used:
const monsterAdapter = require('./vfs/osjs-monster-adapter')

// If second approach for installing has used:
// const monsterAdapter = require('@burna/osjs-monster-adapter')

osjs.register(VFSServiceProvider, {
  args: {
    adapters: {
      monster: monsterAdapter
    }
  }
});
```

Then create a mountpoint. Example using default Swift Account:

```javascript
// src/server/config.js
{
  vfs: {
          mountpoints: [{
              name: 'myMonster',
              adapter: 'monster',
              attributes: {
                  endpoint: "http://localhost:12345/auth/v1.0",
                  username: "test:tester",
                  password: "testing"
              }
          }]
      }
}

// src/client/config.js
{
  vfs: {
      defaultPath: 'myMonster:/',
      mountpoints: [{
        name: 'myMonster',
        label: 'Monster Drive'
      }]
    }
}
```
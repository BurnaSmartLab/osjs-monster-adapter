# OS.js SWIFT VFS Adapter

This is the SWIFT VFS (Server) Adapter for OS.js.

## Installation

```
git clone https://github.com/BurnaSmartLab/osjs-monster-adapter.git

npm install

npm update
```

## Usage

```javascript
// src/server/index.js
const monsterAdapter = require('./vfs/monster-adapter')

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

const Common = require('./Common').Common;
module.exports = class Auth {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  login(username, password) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('GET', that.endpoint, true);
      common.setRequestHeader('X-Storage-User', username);
      common.setRequestHeader('X-Storage-Pass', password);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            let headers = new Map();
            headers.set('x_storage_url', common.getResponseHeader('X-Storage-Url'));
            headers.set('x_storage_token', common.getResponseHeader('X-Auth-Token'));
            resolve(headers);
          } else {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));
  }
};

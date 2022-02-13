const Common = require('./Common').Common;
module.exports = class Account {
  constructor(x_storage_url, x_storage_token) {
    this.x_storage_url = x_storage_url;
    this.x_storage_token = x_storage_token;
  }

  accountDetails(content_type = 'text/plain; charset=utf-8', options, delimiter = '/') {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      if(options.page) {
        common.open('GET', encodeURI(`${that.x_storage_url}?limit=${options.page.size}&marker=${options.page.marker}`), true);
      }else {
        common.open('GET', that.x_storage_url, true);
      }
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.setRequestHeader('Accept', content_type);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            resolve({
              'status':common.status,
              'responseHeader':{
                'objectCount': common.getResponseHeader('X-Account-Object-Count'),
                'bytesUsed': common.getResponseHeader('X-Account-Bytes-Used'),
                'containerCount': common.getResponseHeader('X-Account-Container-Count'),
              },
              'message':common.responseText,
              'code':common.status,
            });
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

/* accountDetails(content_type = "text/plain; charset=utf-8",delimiter = '/') {

        let that = this
        return (async (that) => {
            console.log(that)
            try {
                const response = await common(that.x_storage_url,{headers:{
                        'X-Auth-Token': that.x_storage_token,
                        'Accept': content_type
                    }});
                return await response.json();

            } catch (error) {
                return [];
            }
        })()
    }*/

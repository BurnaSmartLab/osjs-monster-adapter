const mime = require('mime');
const http = require('./Common');
const Common = http.Common;
const axios = http.axios;

module.exports = class Container {
  constructor(x_storage_url, x_storage_token) {
    this.x_storage_url = x_storage_url;
    this.x_storage_token = x_storage_token;
  }

  getContainerObjectDetails(container, content_type = 'text/plain; charset=utf-8', delimiter = '', prefix, options) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      if(options.page) {
        common.open('GET', encodeURI(`${that.x_storage_url}/${container}?limit=${options.page.size}&marker=${prefix + options.page.marker}&delimiter=${delimiter}&prefix=${prefix}`), true);
      }else {
        common.open('GET', encodeURI(`${that.x_storage_url}/${container}?delimiter=${delimiter}&prefix=${prefix}`), true);
      }
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.setRequestHeader('Accept', content_type);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200 || this.status === 204) {
            resolve({
              'responseHeader':{
                'objectCount': common.getResponseHeader('X-Container-Object-Count'),
                'bytesUsed': common.getResponseHeader('X-Container-Bytes-Used')
              },
              'message': common.responseText,
              'code': common.status
            });
          } else if (this.status === 404) {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));
  }

  getContainerMetadata(container) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('HEAD', encodeURI(that.x_storage_url + '/' + container), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 204) {
            resolve({
              'message': common.getAllResponseHeaders(),
              'code': common.status
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

  getObjectContent(container, object) {
    return new Promise(((resolve, reject) => {
      axios.get(encodeURI(`${this.x_storage_url}/${container}/${object}`), {
        headers: {
          'X-Auth-Token': this.x_storage_token
        },
        responseType: 'stream'
      }).then(response => {
        if (response.status === 200) {
          resolve ({
            'message': response.data,
            'code': response.status
          });
        }
      }).catch(error=> {
        const err = new Error(error.response.statusText);
        err.code =  error.response.status;
        reject(err);
      });
    }));

  }

  getObjectMetadata(container, object) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('HEAD', that.x_storage_url + '/' + container + '/' + object, true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            resolve({
              'message': common.getAllResponseHeaders(),
              'code': common.status
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

  createContainer(container) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('PUT', encodeURI(that.x_storage_url + '/' + container), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.setRequestHeader('Content-Length', '0');
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 201 || this.status === 202) {
            resolve({
              'message': 'container added to monster-adapter successfully',
              'code': common.status
            });
          } else if (this.status === 400 || this.status === 404 || this.status === 507) {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));

  }

  createDirectory(container, object, metaDatas = []) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('PUT', that.x_storage_url + '/' + container + '/' + object, true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      metaDatas.forEach((value, key) => {
        common.setRequestHeader(key, value);
      });
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 201) {
            resolve({
              'message': 'Object created successfully',
              'code': common.status
            });
          } else if (this.status === 404 || this.status === 408 || this.status === 411 || this.status === 422) {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));
  }

  createObject(container, object, data) {
    return new Promise(((resolve, reject) => {
      return axios.put(encodeURI(`${this.x_storage_url}/${container}/${object}`), data, {
        headers: {
          'X-Auth-Token': this.x_storage_token,
          'Content-Type': mime.getType(object),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }).then(response => {
        if (response.status === 201) {
          resolve ({
            'message': 'Object created successfully',
            'code': response.status
          });
        }
      }).catch(error=> {
        const err = new Error(error.response.statusText);
        err.code =  error.response.status;
        reject(err);
      });
    }));
  }

  removeContainer(container) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('DELETE', encodeURI(`${that.x_storage_url}/${container}`), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 204) {
            resolve({
              'message': 'Container deleted successfully',
              'code': common.status
            });
          } else if (this.status === 404 || this.status === 409) {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));
  }

  removeObject(container, object) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('DELETE', encodeURI(that.x_storage_url + '/' + container + '/' + object), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 204) {
            resolve({
              'message': 'Object removed successfully',
              'code': common.status
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

  copyObject(source, destination) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('COPY', encodeURI(that.x_storage_url + source), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.setRequestHeader('Destination', encodeURI(destination));
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 201) {
            resolve({
              'message': 'Object copied successfully',
              'code': common.status
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

  updateContainerMetadata(container, metaDatas) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('POST', that.x_storage_url + '/' + container, true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      metaDatas.forEach((value, key) => {
        common.setRequestHeader(key, value);
      });
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 204) {
            resolve({
              'message': 'Container Metadata successfully',
              'code': common.status
            });
          } else {// if (this.status === 404) {
            const err = new Error(common.responseText);
            err.code =  common.status;
            reject(err);
          }
        }
      };
      common.send();
    }));
  }

  updateObjectMetadata(container, object, metaDatas) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('POST', that.x_storage_url + '/' + container + '/' + object, true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      metaDatas.forEach((value, key) => {
        common.setRequestHeader(key, value);
      });
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 202) {
            resolve({
              'message': this.responseText,
              'code': common.status
            });
          } else {// if (this.status === 404) {
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

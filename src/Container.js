const mime = require('mime');
const http = require('./Common');
const Common = http.Common;
const axios = http.axios;

module.exports = class Container {
  constructor(x_storage_url, x_storage_token) {
    this.x_storage_url = x_storage_url;
    this.x_storage_token = x_storage_token;
  }

  getContainerObjectDetails(container, content_type = 'text/plain; charset=utf-8', delimiter = '', prefix) {
    let that = this;
    return new Promise(((resolve, reject) => {
      let common = new Common();
      common.open('GET', encodeURI(`${that.x_storage_url}/${container}?delimiter=${delimiter}&prefix=${prefix}`), true);
      common.setRequestHeader('X-Auth-Token', that.x_storage_token);
      common.setRequestHeader('Accept', content_type);
      common.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200 || this.status === 204) {
            resolve({
              'status': common.status,
              'responseHeader':{
                'objectCount': common.getResponseHeader('X-Container-Object-Count'),
                'bytesUsed': common.getResponseHeader('X-Container-Bytes-Used')
              },
              'message': common.responseText
            });
          } else if (this.status === 404) {
            reject({
              'status': common.status,
              'message': 'Error'
            });
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
              'status': common.status,
              'message': common.getAllResponseHeaders()
            });
          } else {
            reject({
              'status': common.status,
              'message': 'Error'
            });
          }
        }
      };
      common.send();
    }));
  }

  getObjectContent(container, object) {
    return axios.get(encodeURI(`${this.x_storage_url}/${container}/${object}`), {
      headers: {
        'X-Auth-Token': this.x_storage_token,
        'Content-Disposition': 'attachment; filename*=utf-8\'\'' + decodeURI(object),
      },
      responseType: 'stream'
    }).then(response => {
      console.log(response);
      if (response.status === 200) {
        return ({
          'status': response.status,
          'message': response.data
        });
      } else if (response.status === 404 || response.status === 416) {
        return ({
          'status': response.status,
          'message': 'Error'
        });
      }
    });
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
              'status': common.status,
              'message': common.getAllResponseHeaders()
            });
          } else {
            reject({
              'status': common.status,
              'message': 'Error'
            });
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
              'status': common.status,
              'message': 'container added to monster-adapter successfully'
            });
          } else if (this.status === 400 || this.status === 404 || this.status === 507) {
            reject({
              'status': common.status,
              'message': 'Error'
            });
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
              'status': common.status,
              'message': 'Object created successfully'
            });
          } else if (this.status === 404 || this.status === 408 || this.status === 411 || this.status === 422) {
            reject({
              'status': common.status,
              'message': 'Error'
            });
          }
        }
      };
      common.send();
    }));
  }

  createObject(container, object, data) {
    return axios.put(encodeURI(`${this.x_storage_url}/${container}/${object}`), data, {
      headers: {
        'X-Auth-Token': this.x_storage_token,
        'Content-Type': mime.getType(object),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }).then(response => {
      if (response.status === 201) {
        return ({
          'status': response.status,
          'message': 'Object created successfully'
        });
      } else if (response.status === 404 || response.status === 408 || response.status === 411 || response.status === 422) {
        return ({
          'status': response.status,
          'message': 'Error'
        });
      }
    });
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
              'status': common.status,
              'message': 'Container deleted successfully'
            });
          } else if (this.status === 404 || this.status === 409) {
            reject({
              'status': common.status,
              'message': common.responseText
            });
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
              'status': common.status,
              'message': 'Object removed successfully'
            });
          } else if (this.status === 404 || this.status === 409) {
            reject({
              'status': common.status,
              'message': common.responseText
            });
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
              'status': common.status,
              'message': 'Object copied successfully'
            });
          } else/* if (this.status === 404 || this.status === 409)*/{
            reject({
              'status': common.status,
              'message': common.responseText
            });
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
              'status': common.status,
              'message': 'Container Metadata successfully'
            });
          } else if (this.status === 404) {
            reject({
              'status': common.status,
              'message': 'Error'
            });
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
              'status': common.status,
              'message': this.responseText
            });
          } else if (this.status === 404) {
            reject({
              'status': common.status,
              'message': 'Error'
            });
          }
        }
      };
      common.send();
    }));
  }
};

const Auth = require('./Auth');
const Account = require('./Account');
const Container = require('./Container');

module.exports = class Monster {
  constructor(endpoint = 'http://localhost:12345/auth/v1.0') {
    this.endpoint = endpoint;
    this.auth = new Auth(this.endpoint);
  }

  init(x_storage_url = '', x_storage_token = '') {
    this.account = new Account(x_storage_url, x_storage_token);
    this.container = new Container(x_storage_url, x_storage_token);
  }

  async login(username = '', password = '') {
    return new Promise(((resolve, reject)=> {
      const $this = this;
      this.auth.login(username, password).then(res => {
        $this.init(res.get('x_storage_url'), res.get('x_storage_token'), '/');
        resolve();
      }).catch(err=> reject(err));
    }));
  }

  async accountDetails(content_type = 'text/plain; charset=utf-8', options) {
    return new Promise(((resolve, reject)=> {
      this.account.accountDetails(content_type, options).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async getContainerObjectDetails(container, content_type = 'text/plain; charset=utf-8', delimiter = '', prefix = '', options) {
    return new Promise(((resolve, reject)=> {
      this.container.getContainerObjectDetails(container, content_type, delimiter, prefix, options).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async getContainerMetadata(container) {
    return new Promise(((resolve, reject)=> {
      this.container.getContainerMetadata(container).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async getObjectContent(container, object) {
    return new Promise(((resolve, reject)=> {
      this.container.getObjectContent(container, object).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async getObjectMetadata(container, object) {
    return new Promise(((resolve, reject)=> {
      this.container.getObjectMetadata(container, object).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async createContainer(container) {
    return new Promise(((resolve, reject)=> {
      this.container.createContainer(container).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async createObject(container, object, data) {
    return new Promise(((resolve, reject)=> {
      this.container.createObject(container, object, data).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async createDirectory(container, object, metaDatas = []) {
    return new Promise(((resolve, reject)=> {
      this.container.createDirectory(container, object, metaDatas).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async removeContainer(container) {
    return new Promise(((resolve, reject)=> {
      this.container.removeContainer(container).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async removeObject(container, object) {
    return new Promise(((resolve, reject)=> {
      this.container.removeObject(container, object).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async copyObject(source, destination) {
    return new Promise(((resolve, reject)=> {
      this.container.copyObject(source, destination).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async updateContainerMetadatas(container, metadatas) {
    return new Promise(((resolve, reject)=> {
      this.container.updateContainerMetadata(container, metadatas).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

  async updateObjectMetadata(container, object, metadatas) {
    return new Promise(((resolve, reject)=> {
      this.container.updateObjectMetadata(container, object, metadatas).then(res=> resolve(res)).catch(err=> reject(err));
    }));
  }

};

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; // XMLHTTPRequest object must generated each time
const axios = require('axios');
exports.Common = class Common extends XMLHttpRequest {
  constructor() {
    super();
  }
};
exports.axios = axios;

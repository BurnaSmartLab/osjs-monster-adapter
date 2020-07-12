const Common = require("./Common").Common;
module.exports = class Account {
    constructor(x_storage_url, x_storage_token) {
        this.x_storage_url = x_storage_url
        this.x_storage_token = x_storage_token
    }

    accountDetails(content_type = "text/plain; charset=utf-8",delimiter = '/') {
        var that = this
        return new Promise(function (resolve, reject) {
            let common = new Common()
            common.open("GET", that.x_storage_url, true)
            common.setRequestHeader("X-Auth-Token", that.x_storage_token)
            common.setRequestHeader("Accept", content_type)
            common.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        resolve({
                            'status':common.status,
                            'message':common.responseText
                        });
                    } else {
                        reject({
                            'status':common.status,
                            'message':"Error"
                        })
                    }
                }
            };
            common.send();
        });
    }

    /*accountDetails(content_type = "text/plain; charset=utf-8",delimiter = '/') {
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
}
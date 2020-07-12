const Auth = require("./Auth")
const Account = require("./Account")
const Container = require("./Container")

module.exports = class Monster {
    constructor(endpoint = "http://localhost:12345/auth/v1.0") {
        this.endpoint = endpoint
        this.auth = new Auth(this.endpoint)
    }

    init(x_storage_url = "", x_storage_token = "") {
        this.account = new Account(x_storage_url, x_storage_token)
        this.container = new Container(x_storage_url, x_storage_token)
    }

    async login(username = "", password = "") {
        try {
            const $this = this
            const result = await this.auth.login(username, password)
            $this.init(result.get("x_storage_url"), result.get("x_storage_token"), '/')
        } catch (e) {
            return e
        }
    }

    async accountDetails(content_type = "text/plain; charset=utf-8") {
        try {
            return await this.account.accountDetails(content_type)
        } catch (e) {
            return e
        }
    }

    async getContainerObjectDetails(container, content_type = "text/plain; charset=utf-8", delimiter='', prefix= '') {
        try {
            return await this.container.getContainerObjectDetails(container, content_type, delimiter, prefix)
        } catch (e) {
            return e
        }
    }

    async getContainerMetadata(container) {
        try {
            return await this.container.getContainerMetadata(container)
        } catch (e) {
            return e
        }
    }

    async getObjectContent(container, object) {
        try {
            return await this.container.getObjectContent(container, object)
        } catch (e) {
            return e
        }
    }

    async getObjectMetadata(container, object) {
        try {
            return await this.container.getObjectMetadata(container, object)
        } catch (e) {
            return e
        }
    }

    async createContainer(container) {
        try {
            return await this.container.createContainer(container)
        } catch (e) {
            return e
        }
    }

    async createObject(container, object, data) {
        try {
            return await this.container.createObject(container, object, data)
        } catch (e) {
            return e
        }
    }
    async createDirectory(container, object, metaDatas=[]) {
        try {
            return await this.container.createDirectory(container, object, metaDatas)
        } catch (e) {
            return e
        }
    }

    async removeContainer(container) {
        try {
            return await this.container.removeContainer(container)
        } catch (e) {
            return e
        }
    }

    async removeObject(container, object) {
        try {
            return await this.container.removeObject(container, object)
        } catch (e) {
            return e
        }
    }

    async copyObject(source, destination) {
        try {
            return await this.container.copyObject(source, destination)
        } catch (e) {
            return e
        }
    }

    async updateContainerMetadatas(container, metadatas) {
        try {
            return await this.container.updateContainerMetadata(container, metadatas)
        } catch (e) {
            return e
        }
    }

    async updateObjectMetadata(container, object, metadatas) {
        try {
            return await this.container.updateObjectMetadata(container, object, metadatas)
        } catch (e) {
            return e
        }
    }

}
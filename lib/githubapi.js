#!/usr/bin/env node
'use strict';

const Octokat = require('octokat');

const base64_to_string = (data) => Buffer.from(data,'base64').toString('utf-8');
const string_to_base64 = (string) => Buffer.from(string).toString('base64');



class Github {
    constructor(token, owner, repo) {
        this.repo = new Octokat({token: token}).repos(owner, repo);
    }

    async get_json(path) {
        const content_gh_data = await this.repo.contents(path).fetch(); 
        return {
            content : JSON.parse(base64_to_string(content_gh_data.content)),
            sha     : content_gh_data.sha
        }
    }

    async get_listing(path, page_size = null) {
        return page_size !== null ? this.repo.contents(path).fetch({per_page: page_size}) : this.repo.contents(path).fetch(); 
    }

    async get_file(path, file_name) {
        return this.repo.contents(path, file_name).read(); 
    }

    async update(path, message, new_content, sha = undefined) {
        const new_gh_data = {
            message: message,
            content: string_to_base64(JSON.stringify(new_content,null,4))
        }
        if (sha !== undefined) new_gh_data.sha = sha;
        await this.repo.contents(path).add(new_gh_data);
        return;
    }

}

module.exports = { Github };


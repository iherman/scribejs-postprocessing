const nscrypto = require('crypto');


interface cache {
    [key:string]: string
}


class OctokatCache {
    private values: cache = {};
    private nonce: number;
    constructor() {
        this.nonce = 0;
    }
    value(key: string): string {
        if (this.values[key] === undefined) {
            const hash = nscrypto.createHash('md5')
            const data = hash.update(`${key} ${this.nonce}`, 'utf-8');
            this.nonce += 1;
            this.values[key] = data.digest('hex');
        }
        return this.values[key];
    }
}

const t = new OctokatCache();

console.log(t.value('w3c/wg'));
console.log(t.value('w3c/epub'));
console.log(t.value('w3c/wg'));

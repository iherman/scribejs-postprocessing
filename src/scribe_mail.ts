import * as path from 'path';
import * as fs from 'fs';
/** @internal */
const fsp = fs.promises;

import * as nodemailer      from 'nodemailer';
import { Credentials }      from './lib//types';
import { USER_CONFIG_NAME } from './lib/config';

const CONFIG_LOCATION = "/Users/ivan/W3C/github/Tools/scribejs/BrowserView/Groups/config";

interface Config {
    "acurlpattern"?: "string";
    "group_mail"?: "string";
    "group_name"?: "string"; 
}


async function send_mail(credentials: Credentials, config: Config, date: string): Promise<void> {
    console.log(JSON.stringify(credentials,null,4));
    try {
        const transporter = await nodemailer.createTransport({
            host   : credentials.smtp_server,
            port   : credentials.smtp_port,
            secure : credentials.smtp_secure,
            auth   : {
                user : credentials.smtp_user,
                pass : credentials.smtp_pwd,
            },
        })

        const send_results = await transporter.sendMail({
            from    : credentials.smtp_from,
            // to      : config.group_mail,
            to      : "ivan.herman@me.com",
            subject : `[Minutes] ${config.group_name} ${date}`,
            text    : `
Minutes are available at:

    ${config.acurlpattern.replace("%DATE%", date)}

Cheers

Ivan
`,
        })
    } catch (e) {
        console.log(`Error in sending email access: ${e}`)
    }
}

async function test() {
    let credentials: Credentials;
    try {
        const fname: string          = path.join(process.env.HOME, USER_CONFIG_NAME);
        const config_content: string = await fsp.readFile(fname, 'utf-8');
        credentials = JSON.parse(config_content) as Credentials;
    } catch (e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    await send_mail(credentials)
}

test()



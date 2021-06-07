import * as nodemailer       from 'nodemailer';
import { Repo, Credentials } from './types';

export async function send_mail(config: Repo, credentials: Credentials, date: string): Promise<void> {
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

        await transporter.sendMail({
            from    : credentials.smtp_from,
            // to      : config.group_mail,
            to      : "ivan.herman@me.com",
            subject : `[Minutes] ${config.mail_subject} ${date}`,
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


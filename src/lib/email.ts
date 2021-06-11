/**
 * ## Sending a notification mail to the group's public mailing list
 *
 * @packageDocumentation
*/

import * as nodemailer       from 'nodemailer';
import { Repo, Credentials } from './types';

/**
 * Send out a meeting minutes mail to the WG's public mailing list
 * 
 * @param config - using dataa on the mail subject and group's mailing list
 * @param credentials - using the SMTP related credential data
 * @param date - date of the minutes
 */
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
        });

        const mailinfo = await transporter.sendMail({
            from    : credentials.smtp_from,
            to      : config.group_mail,
            // to      : "team-test@w3.org",
            subject : `[Minutes] ${config.mail_subject} ${date}`,
            text    : `
Minutes are available at:

    ${config.acurlpattern.replace("%DATE%", date)}

Cheers

Ivan

----
Ivan Herman, W3C 
Home: http://www.w3.org/People/Ivan/
mobile: +33 6 52 46 00 43
`,
        });
        console.log(`Message sent to ${config.group_mail}, see https://www.w3.org/mid/${mailinfo.messageId.slice(1,-1)}`);
    } catch (e) {
        console.log(`Error in sending email access: ${e}`)
    }
}


import sgMail from '@sendgrid/mail'
import { logger } from '@p0/common'

//  ----------------------------------------------------------------------------------------------//

const {
  SENDGRID_API_KEY
} = process.env

sgMail.setApiKey(<string>SENDGRID_API_KEY)

//  ---------------------------------

export const sendScheduledTestsLog = async (recipients: string[], log: string, applied: number, failed: number): Promise<void> => {
  const msg = {
    to: recipients,
    from: 'publisher@project-zero.org',
    subject: 'Scheduled tests executed',
    html: `Hi there,<br /><br />The scheduled tests executed with ${applied} rules tested successfully and ${failed} failed.<br /><br />Log:<pre>${log}</pre>`,
    text: `Hi there,\n\nThe scheduled tests executed with ${applied} rules tested successfully and ${failed} failed.\n\nLog:<pre>${log}</pre>`
  }

  try {
    /* const response =  */await sgMail.send(msg)
  } catch (err) {
    logger.error('Email failure', (<Error>err).message)
  }
}


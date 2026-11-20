import nodemailer from 'nodemailer';
import logger, { jsonLog } from './logger';

// Credenciales SMTP desde el entorno (variables de servidor en CapRover; ver .env.example).
// 587 = STARTTLS, 465 = TLS directo. Con Gmail, SMTP_PASSWORD es una contraseña de aplicación.
const smtpPort = Number(process.env.SMTP_PORT || 587);

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const MAIL_FROM = process.env.MAIL_FROM || '"Kyaaa Team" <notifications@kyaaa.net>';

export const sendEmail = async (to: string, subject: string, name: string, html: string) => {
  logger.info(`sendEmail to ${jsonLog(to)}`)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Faltan las variables SMTP_HOST, SMTP_USER o SMTP_PASSWORD');
  }
  return transporter.sendMail({
    from: MAIL_FROM,
    to: to,
    subject: subject,
    html: html,
  })
};

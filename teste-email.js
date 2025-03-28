import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: `"Teste" <${process.env.EMAIL_USER}>`,
  to: 'seuemail@gmail.com',
  subject: 'Teste de Configuração',
  text: 'Se você recebeu este e-mail, o problema está resolvido!'
}).then(() => console.log('E-mail enviado com sucesso!'))
  .catch(error => console.error('Erro:', error));
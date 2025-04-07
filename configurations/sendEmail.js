const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, html = null) => {
  const bodyContent = text || '';
  const htmlContent = html || '';

  try {
    const transporter = new nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: "587",
      secure: false,
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailInfo = {
      from: process.env.GOOGLE_EMAIL,
      to: email,
      subject: subject,
    }

    await transporter.sendMail(htmlContent ? {...mailInfo, html: htmlContent} : {...mailInfo, text: bodyContent});
  } catch (error) {
    console.log("error while sending email ", error);
    throw new Error("Failed to sending email to User");
  }
};

module.exports = sendEmail;

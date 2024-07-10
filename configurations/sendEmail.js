const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  const bodyContent = `Please click on the link to verify ${text}`;

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

    const info = await transporter.sendMail({
      from: process.env.GOOGLE_EMAIL,
      to: email,
      subject: subject,
      text: bodyContent,
    });
  } catch (error) {
    console.log("error while sending email ", error);
    throw new Error("Failed to sending email to User");
  }
};

module.exports = sendEmail;

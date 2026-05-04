import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "arman6754srq@gmail.com",
      pass: "gfynctgsoxtghkdi"
    }
  });

  await transporter.sendMail({
    from: "arman6754srq@gmail.com",
    to,
    subject,
    html
  });
};

export default sendEmail;
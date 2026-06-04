// Endpoint de test SMTP (temporaire)
const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  try {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const transport = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: { user, pass },
    });

    const info = await transport.sendMail({
      from: `"Test" <${user}>`,
      to: "muhamedndiaye00@gmail.com",
      subject: "Test SMTP Vercel",
      text: "Si tu vois ce message, le SMTP marche sur Vercel !",
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    res.json({ ok: false, error: err.message, code: err.code });
  }
};

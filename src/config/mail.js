export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: "50762cdced8160",
    pass: "2a4bf3ce980f8b",
    user: process.env.MAIL_USER,
  },
  default: {
    from: "Equipe GoBarber <noreply@gobarber.com>",
  },
};

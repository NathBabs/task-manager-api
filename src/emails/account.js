const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "nathanielbabalola1@gmail.com",
    subject: "Thanks for Signing up",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app`,
  });
};

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "nathanielbabalola1@gmail.com",
    subject: "Cancellation of Account",
    text: `Thanks for working with us Mr/Mrs ${name}. Is there any thing we could have done to have kept you`,
  });
};

const sendOptInMail = (email, userID) => {
  let activationLink = `${process.env.BASE_URL}/users/verify/${userID}`;

  sgMail.send({
    to: email,
    from: "nathanielbabalola1@gmail.com",
    subject: "Account Activation",
    text: `To activate your account, please click this link: ${activationLink}`,
    html: `<p>To activate your account, please click this link: <a href="${activationLink}">${activationLink}</a></p>`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
  sendOptInMail,
};

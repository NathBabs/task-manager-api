const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nathaniel.babalola@signalalliance.com',
        subject: 'Thanks for Signing up',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app`
    })
};

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nathaniel.babalola@signalalliance.com',
        subject: 'Cancellation of Account' ,
        text: `Thanks for working with us Mr/Mrs ${name}. Is there any thing we could have done to have kept you`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
};
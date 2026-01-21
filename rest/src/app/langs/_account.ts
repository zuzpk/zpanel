const LangAccount = {
    
    //signup
    emailPassRequired: `Email and password are required.`,
    invalidEmail: `Provide valid email address.`,
    invalidEmailDomain: `Invalid domain for email address.`,
    emailExists: 'A user with that email already exist.',
    accountCreated: `Goog job! Your account has been created.`,
    accountNotCreated: `your account was not created, try again.`,

    //signin
    unknownEmail: `That email address is not associated with any account.`,
    wrongPassword: 'Your password is wrong. Try again with correct password.',
    youAreBanned: `You are banned from %0.`,
    signinFailed: `Signin request failed. try again.`,

    //signout
    signoutSucess: `You have been signed out.`,
    signoutFailed: `Failed to signout. Please try again.`,

    //recover
    recoveryFailed: `Account recovery request failed. try again.`,
    recoveryEmailSent: `Recovery code sent.`,
    recoverEmailFailed: `Recover code was not sent, try again.`,
    securityTokenInvalid: `Security token mismatched.`,
    passwordUpdated: `Your password has been updated.`,
    passwordNotUpdated: `We can't update your password right now.`,

    //verify
    verifyTokenRequired: `VerificationToken is required.`,
    verifyTokenInvalid: `Verification code is either expired or invalid. please try again.`,
    alreadyVerified: `You have already verified your account.`,
    verifySuccess: `Your account has been verified.`,
    verifyFailed: `Verification was not successful. please try again.`,

    //Emails
    emailSignupSubject: `Email verification code: %0`,
    emailSignupMessage: [
            `<div style="max-width:600px;font-size:16px;text-align:center;margin:0 auto;">`,
            `Welcome to <b>%0</b>`,
            `Use this code to finish setting up your account`,
            `<div style="padding:30px 0px 0px 0px;text-align:center;font-size:50px;font-weight:bold;">%1</div>`,
            `<div style="padding:0px 0px 30px 0px;text-align:center;">`,
            `or use this link to verify your account:<br />`,
            `<a href="%2">%2</a></div>`,
            `If you don't recognize <b>%3</b>, you can safely ignore this email`,
            `</div>`
        ].join(`<br />`),

    emailRecoverSubject: `Account recovery code: %0`,
    emailRecoverMessage: [
        `<div style="max-width:600px;font-size:16px;text-align:center;margin:0 auto;">`,
        `Reset your password`,
        `If you requested a password reset for your %0 account, below is your reset code. If you didn\'t make this request, ignore this email.`,
        `<div style="padding:30px 0px 0px 0px;text-align:center;font-size:50px;font-weight:bold;">%1</div>`,
        `<div style="padding:0px 0px 30px 0px;text-align:center;">`,
        `or use this link to recover your account:<br />`,
        `<a href="%2">%2</a></div>`,
        `If you don't recognize <b>%3</b>, you can safely ignore this email`,
        `</div>`
    ].join(`<br />`)
}

export default LangAccount
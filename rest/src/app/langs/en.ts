import LangAccount from "./_account.js"

const Lang = {

    youAreLost: `you are lost buddy.`,
    apiWrongMethod: `almost there :) try again with correct method.`,
    apiWrongAction: `almost there :) try again with correct action.`,
    serverBusy: `This is not you. this is us.`,
    unauthorized: `Well played!. You are not authorized for this action`,
    accessdenied: `It looks like you don’t have permission to be here.`,

    //WebPushNotifcations
    webPushWelcomeTitle: "Welcome aboard!",
    webPushWelcomeMessage: "You're all set! Get ready for real-time updates.",

    ...LangAccount

}

export default Lang
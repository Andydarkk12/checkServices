const axios = require("axios")
const pino = require('pino')
const TelegramBot = require('node-telegram-bot-api');




const infoChatId = 1644953534           //ВСТАВИТЬ ID ЧАТА С БОТОМ @CheckServices111_bot
const API_KEY_BOT = '8080486175:AAF0uTQhBbeVvezfEmCa_ifkLyIdLmQvIrI';
const bot = new TelegramBot(API_KEY_BOT, {
    polling: true
});




const exampleUser = {
    firstName:'Иван',
    lastName:'Иванов'
}


const services=[
    {
        name: "formit",
        url: "https://formit.fake",
        errCount:0,
        example : exampleUser
    },
    {
        name: "datavalidator",
        url: "https://datavalidator.fake",
        errCount:0,
        example : 'formit'
    },
    {
        name: "leadsynk",
        url: "https://leadsynk.fake",
        errCount:0,
        example : 'datavalidator'
    },
    {
        name: "bitdashboard",
        url: "https://bitdashboard.fake",
        errCount:0,
        example : 'datavalidator'
    },
]

bot.on('text', async msg => {
    console.log(msg.chat.id)
    await bot.sendMessage(msg.chat.id, msg.text)
})

const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { 
            destination: './checkService.log',
            
         }
      },
      {
        target: 'pino-pretty',
        options: { 
            colorize: true,
            ignore: 'pid,hostname,level',
         }
      }
    ]
  }
});



const checkServices = async (url,req) =>{
    let startTime = Date.now()
    try{
        let response = await axios.post(url,req,{ timeout: 2000 })
        let responseTime = Date.now()-startTime
        logger.info(`time:${new Date().toUTCString()}; url:${url}; code:${response.status},responseTime:${responseTime}ms`)
        return response.status
    }
    catch(e){
        let responseTime = Date.now()-startTime
        if(e.code!=undefined){
            logger.info(`time:${new Date().toUTCString()}; url:${url}; error:${e.code},responseTime:${responseTime}ms`)
            return e.code
        }
        else{
            logger.info(`time:${new Date().toUTCString()}; url:${url}; error:${e.response.status},responseTime:${responseTime}ms`)
            return e.response.status
        }
    }
    
}
const startCheck = async () =>{
    for(let i=0;i<services.length;i++){
    let response = await checkServices(services[i].url,services[i].example)
    if (Math.floor(response/100)!=2)
        services[i].errCount += 1
    if  (services[i].errCount>2){
        services[i].errCount=0
        bot.sendMessage(infoChatId, `Произошла ошибка в сервисе ${services[i].name}, код ошибки ${response}`)
    }
        
}
}
checking = setInterval(startCheck, 5*60*1000)
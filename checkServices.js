const axios = require("axios")
const pino = require('pino')
const TelegramBot = require('node-telegram-bot-api');
const  { NodeSSH }  =  require ( 'node-ssh' );
const { connection } = require("mongoose");
const ssh = new NodeSSH()



const infoChatId = 1644953534           //ВСТАВИТЬ ID ЧАТА С БОТОМ @CheckServices111_bot
const API_KEY_BOT = '8080486175:AAF0uTQhBbeVvezfEmCa_ifkLyIdLmQvIrI';
const bot = new TelegramBot(API_KEY_BOT, {
    polling: true
});




const exampleUser = {
    firstName:'Иван',
    lastName:'Иванов'
}

// modelSsh = {
//       host: 'ip',
//       port: 22,
//       username: 'root',
//       password: '123',
//       readyTimeout: 5000
// }
const services=[
    {
        name: "formit",
        url: "https://formit.fake",
        errCount:0,
        example : exampleUser,
        ssh:{
            host: 'ip',
            port: 22,
            username: 'root',
            password: '123',
            readyTimeout: 5000
        }
    },
    {
        name: "datavalidator",
        url: "https://datavalidator.fake",
        errCount:0,
        example : 'formit',
        ssh:{
            host: 'ip',
            port: 22,
            username: 'root',
            password: '123',
            readyTimeout: 5000
        }
    },
    {
        name: "leadsynk",
        url: "https://leadsynk.fake",
        errCount:0,
        example : 'datavalidator',
        ssh:{
            host: 'ip',
            port: 22,
            username: 'root',
            password: '123',
            readyTimeout: 5000
        }
    },
    {
        name: "bitdashboard",
        url: "https://bitdashboard.fake",
        errCount:0,
        example : 'datavalidator',
        ssh:{
            host: 'ip',
            port: 22,
            username: 'root',
            password: '123',
            readyTimeout: 5000
        }
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
        let reboot = await rebootSsh(services[i])
        if (reboot == true){
            response = await checkServices(services[i].url,services[i].example)
            if (Math.floor(response/100)!=2)
                bot.sendMessage(infoChatId, `Перезагрузка сервиса ${services[i].name} не помогла, примите меры`)
            else{
                errCount = 0
                bot.sendMessage(infoChatId, `После перезагрузки сервис ${services[i].name} работает корректно`)
            }
        }
    }
        
}
}
// Если при проверке сервиса ошибка всплывет 3 и больше раз,
// поступит уведомление с кодом ошибки, после чего мы попытаемся перезагрузить
// сервис, если после перезагрузки сервис отвечает стабильно, то счетчик ошибок обнуляется.
// Если перезагрузка не получилась или перезагрузка не поможет, отправится уведомление.
// Функцию rebootSsh я сделал С ИСПОЛЬЗОВАНИЕМ НЕЙРОСЕТИ, ОНА УКАЗАЛА НА МОИ ОШИБКИ, тк я 
// неправильно понял использование некоторых функций.
// ТЗ делал без нейросети

const rebootSsh = async (service)=> {
  try {
    await ssh.connect(service.ssh);

    const result = await ssh.execCommand('sudo reboot', {
      stdin: `${service.ssh.password}\n`});

    bot.sendMessage(infoChatId, `Сервис ${service.name} успешно перезагружен`)
    return true
  } catch (error) {
    console.log(error.message);
    bot.sendMessage(infoChatId, `Не удалось перезагрузить ${service.name}, ошибка: \n ${error}`)
    return false
  } finally {
    ssh.dispose();
  }
}


checking = setInterval(startCheck, 5*60*1000)
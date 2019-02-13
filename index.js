const nodemailer = require("nodemailer");
const fs = require('fs');
const moment = require('moment');
const interval = require('interval-promise')

const MAX_TIMEOUT_TIME = 2147483647

async function main() {

  if (process.argv.length < 3) throw Error("Nenhum ficheiro de configuração definido")

  const configFile = JSON.parse(fs.readFileSync(process.argv[2]));
  
  if (configFile.emails.length === 0) {
    throw Error("Nenhum email para enviar. Execução terminada.")
  }

  if (configFile.dayOfSend <= 0 || configFile.dayOfSend > 31) {
    throw Error("Dia de execução inválido.")
  }

  startSendInterval(configFile)
}


const startSendInterval = (configFile, nextMonth = false) => {
  const millisTillNextSend = getRemainingTimeToSendEmail(configFile.dayOfSend, nextMonth)
  console.log(`Sending email in ${timeConversion(millisTillNextSend)}`)

  if (millisTillNextSend === MAX_TIMEOUT_TIME) {
    interval(async (i, stop) => {
      stop()
      startSendInterval(configFile)
    }, millisTillNextSend)
  } else {
    interval(async (i, stop) => {
      await sendEmail(configFile)
      stop()
      startSendInterval(configFile, true)
    }, millisTillNextSend)
  }

}

const sendEmail = async (configFile) => {
  const transporter = nodemailer.createTransport(configFile.config);

  let mailOptions = {
    from: configFile.from,
    to: configFile.emails.join(";"),
    subject: configFile.subject,
    html: configFile.body
  };

  await transporter.sendMail(mailOptions)
  console.log(`Emails sent: ${configFile.emails.length}`)
  return true;
}

const getRemainingTimeToSendEmail = (day, nextMonth = false) => {
  const momDaySend = moment().startOf('day')
  momDaySend.set('date', day)
  const now = moment().startOf('day')

  if (nextMonth || now.isAfter(momDaySend)) { //  ver o fevereiro!
    momDaySend.add(1, 'months')
  }

  const duration = moment.duration(momDaySend.diff(now));
  const millis = duration.asMilliseconds();
  return millis > MAX_TIMEOUT_TIME ? MAX_TIMEOUT_TIME : millis
}

function timeConversion(millisec) {

  var seconds = (millisec / 1000).toFixed(1);

  var minutes = (millisec / (1000 * 60)).toFixed(1);

  var hours = (millisec / (1000 * 60 * 60)).toFixed(1);

  var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

  if (seconds < 60) {
    return seconds + " Sec";
  } else if (minutes < 60) {
    return minutes + " Min";
  } else if (hours < 24) {
    return hours + " Hrs";
  } else {
    return days + " Days"
  }
}


main().catch(err => console.log(err.message))

const request = require('request')
const nodemailer = require('nodemailer');
const cron = require('cron');

const TOKEN = "demo"
const CITY = 'beijing'
const lat = 39.9;
const lon = 116.5;
const URL = "http://api.waqi.info/feed/geo:"+ lat  +";"+ lon +"/?token="+TOKEN

var mostRecentAQIData = 0;
const MINCUTOFF = 100; // 低于提示开窗(优良)
const MAXCUTOFF = 200; // 高于提示关窗(污染)
const mailList = ['receiver_a@example.com','receiver_b@example.com','receiver_c@example.com']

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'example.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'username@example.com',
        pass: 'password'
    }
});
function getCurrentTime() {
	var time = new Date().toLocaleString("en-US", {timeZone: 'Asia/Shanghai'});
	return time;
}
function email(subject, AQI) {
	console.log("sending email...")
	// setup email data with unicode symbols
	let mailOptions = {
	    from: '"Sender Name" <username@example.com>', // sender address
	    to: mailList,
	    subject: subject, // Subject line
	    text: 'City: '+CITY+' \nAQI: '+AQI+"\nTime: "+ getCurrentTime() 
	};
	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
	    if (error) {
	        return console.log(error);
	    }
	    console.log(getCurrentTime());
	    console.log('Message %s sent: %s', info.messageId, info.response);
	});
}

var update = function() {
	request(URL, function(err, res, body) {
		if (!err && res.statusCode == 200) {
			var info = JSON.parse(body)
			var AQI = info.data.aqi
			console.log(getCurrentTime() +" City: " + CITY +" AQI: " +AQI)
			if (AQI < MINCUTOFF && mostRecentAQIData > MINCUTOFF) {
				email('空气良好 注意开窗通风', AQI)
			} else if (AQI > MAXCUTOFF && mostRecentAQIData < MAXCUTOFF) {
				email('空气污染严重 关闭门窗', AQI)
			}
			mostRecentAQIData = AQI
		}
	})
}
update()
var job = cron.job("00 00,30 * * * *", update);
job.start();

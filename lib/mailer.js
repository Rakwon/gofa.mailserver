let config = require('../config');
let mailgun = require('mailgun-js')({apiKey: config.MAILGUN.API, domain: config.MAILGUN.DOMAIN});

exports.sendMail = function(toAddress, subject, content, callback){
    let success = true;

    let data = {
        from: '고파운더 <gofoundermanager@gofounder.net>',
        to: toAddress,
        subject: subject,
        html: content
    };

    mailgun.messages().send(data, function (error, body) {
        if(error){
            console.log("[ERROR] Message NOT sendt : " + error);
            success = false;
        }
        else{
            console.log(body);        
        }
        callback(error, success);
    });
}
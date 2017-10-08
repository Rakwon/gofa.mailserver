var express = require('express');
var mysql = require('mysql');
var config = require('../config');
var mailgun = require('mailgun-js')({apiKey: config.MAILGUN.API, domain: config.MAILGUN.DOMAIN});
var router = express.Router();

var pool = mysql.createPool({
  connectionLimit : 100, //important
  host: config.RDS.HOSTNAME,
  user: config.RDS.USERNAME,
  password: config.RDS.PASSWORD,
  database: config.RDS.DB_NAME

});

//API LIST
/*

HEAD / localhost:3000/api/mail/auth?id=1
HEAD/ localhost:3000/api/mail/project?id=1
HEAD / localhost:3000/api/mail/profile?id=1
HEAD / localhost:3000/api/mail/feed?id=1
HEAD / localhost:3000/api/mail/reply?id=1
POST / localhost:3000/api/mail/all
*/

router.head('/auth', (req, res) => {
  sendMail(req.query.id);
});
router.head('/project', (req, res) => {
  sendMail(req.query.id);
});
router.head('/profile', (req, res) => {
  sendMail(req.query.id);
});
router.head('/feed', (req, res) => {
  sendMail(req.query.id);
});
router.head('/reply', (req, res) => {
  sendMail(req.query.id);
});
router.post('/all', (req, res) => {
  sendMailAll();
});


// 프로젝트, 프로필, 피드, 인증, 댓글의 경우 
// 해당유저 한명에게만 보내면 되므로 sendMail(id) 함수를 이용(id는 받을사람의 user id)
function sendMail(id){

  let query = 'select email from users where id = '+id;
  
  pool.getConnection((error, connection)=>{
    if(error){
      res.json({"code" : 100});
      return ;
    }
    connection.query(query, (err, rows)=>{
      if(err){
        res.json({"code" : 101});
        return ;
      }

      console.log(rows[0].email);

      // 실제 메일을 모내므로 일단 주석처리
      // let data = makeMailData(rows[i].email);
      // mailgun.messages().send(data, function (error, body) {
      //   console.log(rows[0].email);        
      // });
    });
  });
};

// 커스텀 메일의 경우 모든사람에게 보내야 하므로 sendAll()함수를 사용
function sendMailAll(){
  
  let query = 'select email from users';
  
  pool.getConnection((error, connection)=>{
    if(error){
      res.json({"code" : 100});
      return ;
    }
    connection.query(query, (err, rows)=>{
      if(err){
        res.json({"code" : 101});
        return ;
      }
      for(let i in rows){
        console.log(rows[i].email);
      }   
      // 실제 메일을 보내는 함수는 주석처리
      // let data = makeMailData(rows[i].email);
      // mailgun.messages().send(data, function (error, body) {
      //   console.log(rows[0].email);        
      // });
    });
  });
};

function makeMailData(email){
  var data = {
    from: '고파운더 <gofoundermanager@gofounder.net>',
    to: email,
    subject: 'Hello',
    text: 'Testing some Mailgun awesomness!'
  };

  return data;
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  

  res.json({"result" : "OK"});
  // for(var i = 0; i<100000000; console.log(++i));
  
  // pool.getConnection(function(error, connection){
  //   if(error){
  //     res.json({"code": 100, "status" : "Error in connection Database"});
  //   }
  //   console.log('connected as id  : ' + connection.threadId);
  //   connection.query('select * from profiles', function(error, rows){
  //     console.log(rows);
  //     connection.release();
  //     if(error){
  //       res.json(rows);
  //     }
  //   });
  // });
});

module.exports = router;

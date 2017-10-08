var express = require('express');
var mysql = require('mysql');
var config = require('../config');
var router = express.Router();
let async = require('async');
let mailer = require('../lib/mailer');
let jadeCompiler = require('../lib/jadeCompiler');
let pool = mysql.createPool({
  connectionLimit : 100, //important
  host: config.RDS.HOSTNAME,
  user: config.RDS.USERNAME,
  password: config.RDS.PASSWORD,
  database: config.RDS.DB_NAME

});

var filePath = {
  'Auth' : '/emailLayout/auth',
  'Profile' : '/emailLayout/profile',
  'Project' : '/emailLayout/project',
  'Feed' : '/emailLayout/feed',
  'Reply' : '/emailLayout/reply'
};

var mailSubject = {
  'Auth' : '[고파운더]이메일 인증 메일입니다.',
  'Profile' : '님이 작성하신 고프로필에 새 댓글이 달렸습니다. 지금 확인해보세요!',
  'Project' : '님이 작성하신 고프로젝트에 새 댓글이 달렸습니다. 지금 확인해보세요!',
  'Feed' : '님이 고커뮤니티에 작성하신 게시물에 새 답글이 달렸습니다. 지금 확인해보세요!',
  'Reply' : '님이 작성하신 댓글에 새 답글이 달렸습니다. 지금 확인해보세요!'
};

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
  res.send();
  sendAuthMail(req, res);
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
  getEmailList();
});


function sendAuthMail(req, res){
  
  console.log('1');

  let getEmailQuery = 'select email from users where id='+req.query.id;
  let getConfirmTokenQuery = 'select confirm_token from profiles where user_id='+req.query.id;

  pool.getConnection((error, connection)=>{
    if(error){
      console.log(error);
      res.json({"code" : 100});
      return null;
    }
    
    let task = [

      //email 가져오는 쿼리문
      function(callback){
        connection.query(getEmailQuery, (err, rows)=>{
         if(err) return callback(err);
         else if(rows.length == 0) return callback('No email Result Error');
  
         callback(null, rows[0].email);
        });
      },
      
      // confirm token 을 가져오는 쿼리문
      function(callback){
        connection.query(getConfirmTokenQuery, (err, rows)=>{
          if(err) return callback(err);
          else if (rows.length == 0) return callback('No Confirm Token Error');

          callback(null, rows[0].confirm_token);
        });
      }
    ];
    
    async.parallel(task, function(err, result){
      
      // result[0] : eamil
      // result[1] : confirm_token
      //개발 환경이면 email 을 개인 메일로 지정

      if(process.env.NODE_ENV != 'production'){
        result[0] = 'gofa.seong@gmail.com';
        console.log('개발서버 ---- ' + result[0] + '으로 메일을 보냈습니다');        
      }
  
      let data = {
        email : result[0],
        confirm_token : result[1]
      };
        
      jadeCompiler.compile(filePath.Auth, data, function(error, html){
      
        mailer.sendMail(data.email, mailSubject.Auth, html, function(err, success){
          if(err){
            throw new Error('Problem sending email to: ' +data.email);
          }
        });
      });
    });
  });
};

function sendNotiMail(req, res, type){

}
function sendCustomMail(req, res){

}

/* GET users listing. */
router.get('/', function(req, res, next) {
  

  res.json({"result" : "OK"});
  // for(var i = 0; i<100000000; console.log(++i));
  
  pool.getConnection(function(error, connection){
    if(error){
      res.json({"code": 100, "status" : "Error in connection Database"});
    }
    console.log('connected as id  : ' + connection.threadId);
    connection.query('select * from profiles where id=1', function(error, rows){
      console.log(rows);
      connection.release();
      if(error){
        res.json(rows);
      }
    });
  });
});

module.exports = router;

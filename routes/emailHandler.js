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
      let data = {
        email : result[0],
        confirm_token : result[1]
      };

      jadeCompiler.compile(filePath.Auth, data, function(error, html){
      
        mailer.sendMail('gitseong@naver.com', '노드 인증 메일 테스트',html, function(err, success){
          if(err){
            throw new Error('Problem sending email to: ' +'gitseong@naver.com');
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

function sendMail(req, res, type){

  let query;
  let data;
  
  if(typeof req.query.id == 'undefined') query = 'select * from users';
  else query = 'select email from users where id ='+id;
  
  pool.getConnection((error, connection)=>{
    if(error){
      res.json({"code" : 100});
      return;
    }
    connection.query(query, (err, rows)=>{
      if(err){
        res.json({"code" : 101});
        return;
      }
     
      let data = {
        contents : mailMessages[type],
       
      }
      //인증메일
      if(type == 'Auth'){
        data = {
          contents : messages
        }
      }
      //프로젝트, 프로필, 피드, 댓글
      else if(typeof type == 'undefined'){
        data = {

        }
      }
      //커스텀 알람
      else{
        data ={

        }
      }
     
      for(let i in rows){
        // eamilAddress = rows[i].email
        let data = {

        }
        jadeCompiler.compile(filePath[type], data, function(err ,html){

       });

       
      }
      return rows;
    });
  });
}

function getFilePath(type){
  
}
// 쿼리스트링으로 넘오온 유저의 id 값으로 
// 유저의 이메일 정보를 알아온다
function getEmailList(id){
  
  let query;
  
  if(typeof id == 'undefined') query = 'select * from users';
  else query = 'select email from users where id ='+id;
  
  pool.getConnection((error, connection)=>{
    if(error){
      res.json({"code" : 100});
      return null;
    }
    connection.query(query, (err, rows)=>{
      if(err){
        res.json({"code" : 101});
        return null;
      }
      for(let i in rows){
        console.log(rows[i].email);
      }
      return rows;
    });
  });
}
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

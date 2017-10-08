let async = require('async');
let mailer = require('./mailer');
let jadeCompiler = require('./jadeCompiler');
let pool;

var filePath = {
  'Auth' : '/emailLayout/auth',
  'Profile' : '/emailLayout/notice',
  'Project' : '/emailLayout/notice',
  'Feed' : '/emailLayout/notice',
  'Reply' : '/emailLayout/notice'
};

var mailSubject = {
  'Auth' : '[고파운더]이메일 인증 메일입니다.',
  'Profile' : '님이 작성하신 고프로필에 새 댓글이 달렸습니다. 지금 확인해보세요!',
  'Project' : '님이 작성하신 고프로젝트에 새 댓글이 달렸습니다. 지금 확인해보세요!',
  'Feed' : '님이 고커뮤니티에 작성하신 게시물에 새 답글이 달렸습니다. 지금 확인해보세요!',
  'Reply' : '님이 작성하신 댓글에 새 답글이 달렸습니다. 지금 확인해보세요!'
};

exports.init = function(paramPool){
  pool = paramPool;
};

//인증메일용
exports.sendAuthMail = function(req, res){
    
    let getEmailQuery = 'select email from users where id='+req.query.user_id;
    let getConfirmTokenQuery = 'select confirm_token from profiles where user_id='+req.query.user_id;
  
    pool.getConnection((error, connection)=>{
      if(error){
        console.log(error);
        res.json({"errorCode" : 100});
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
        
          if(error){
            throw new Error(error);
            return ;
          }
          
          //개발환경이면 바로 리턴
          if(process.env.NODE_ENV != 'production')
            return ;
  
          mailer.sendMail(data.email, mailSubject.Auth, html, function(err, success){
            if(err)
              throw new Error('Problem sending email to: ' +data.email);
          });
        });
      });
    });
  };
  
exports.sendNotiMail = function(req, res, type){
    
    pool.getConnection((error, connection)=>{
      if(error){
        throw new Error(error)      
        res.json({"errorCode" : 100});
        return null; 
      }
      let task = [
        function(callback){
  
          let getNotificationQuery = 'select to_id, url from notifications where id='+req.query.noti_id;
          connection.query(getNotificationQuery, (err,rows) =>{
            if(err) return callback(err);
            if(rows.length == 0) return callback('No Notificatoin Error');
            
            let data = {
              id : rows[0].to_id,
              url : rows[0].url
            };
  
            callback(null, data);
          });
        },
        function(data, callback){
  
          let getEmailQuery = 'select email from users where id='+data.id;
          
          connection.query(getEmailQuery, (err, rows)=>{
            if(err) return callback(err);
            if(rows.length == 0) return callback('No User Error');
            
            data.email = rows[0].email;
  
            callback(null, data);
          });
        },
        function(data, callback){
          
          let getUserNameQuery = 'select name from profiles where user_id='+data.id;
          connection.query(getUserNameQuery, (err, rows)=>{
            if(err) return callback(err);
            if(rows.length == 0) return callback('No Profile Error');
  
            data.name = rows[0].name;
            callback(null, data);
          });
        },
        function(data, callback){
  
          //개발 환경에서는 메일을 gofa.seong@gmail.com 으로 보낸다.
          if(process.env.NODE_ENV != 'production')
            data.email = 'gofa.seong@gmail.com';
  
          let renderData = {
            contents : data.name + mailSubject[type],
            url : 'https://www.gofounder.net' + data.url
          };
  
          jadeCompiler.compile(filePath[type], renderData, function(err, html){
            if(err){
              throw new Error(err);
              return ;
            }
  
            mailer.sendMail(data.email, data.name + mailSubject[type], html, function(err, success){
              if(err)
                throw new Error('Problem sending email to: ' +data.email);
            });
          });
        }
  
      ];
  
      async.waterfall(task, (err)=>{
        if(err)
          throw new Error(err);
        else
          console.log('done');
      });
  
    });
  }
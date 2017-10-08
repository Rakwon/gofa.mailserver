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

/* GET users listing. */
router.get('/', function(req, res, next) {
  

  res.json({"result" : "OK"});
  for(var i = 0; i<100000000; console.log(++i));
  
  pool.getConnection(function(error, connection){
    if(error){
      res.json({"code": 100, "status" : "Error in connection Database"});
    }
    console.log('connected as id  : ' + connection.threadId);
    connection.query('select * from profiles', function(error, rows){
      console.log(rows);
      connection.release();
      if(error){
        res.json(rows);
      }
    });
  });
});

module.exports = router;

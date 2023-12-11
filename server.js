const express = require('express');
const multer = require('multer');
const path = require('path');
const sha = require('sha256');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const app = express();

const url = 'mongodb+srv://admin:0000@cluster0.ckhbopb.mongodb.net/?retryWrites=true&w=majority';
let mydb;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    mydb = client.db('myboard');

    app.listen(3001, () => {
      console.log("포트 3001으로 서버 대기중 ... ");
    });
  })
  .catch((err) => {
    console.log(err);
  });



// MySQL + nodejs 접속 코드
var mysql = require("mysql2");
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "0000",
  port:3306,
  database: "myboard",
});

conn.connect();




app.use(express.static('public'));
//body-parser 라이브러리 추가
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.get("/", function (req, res) {
  res.render('index.ejs',{user : null});
});
app.get("/list", function (req, res) {
   conn.query("select * from post", function (err, rows, fields) {
     if (err) throw err;
     console.log(rows);
     res.render('list.ejs', { data : rows });
   });   
});

app.get("/listmongo", function (req, res) {
 
      mydb.collection('post').find().toArray().then(result => {
        console.log(result);
        res.render('list_mongo.ejs', { data : result });
      })
});
//'/enter' 요청에 대한 처리 루틴
app.get('/enter', function(req, res){
   res.sendFile(__dirname + '/enter.html');
});
app.get('/entermongo', function(req, res){ 
  res.render('enter.ejs');
});

app.get("/content/:id", function (req, res) { 
  console.log(req.params.id);
  let new_id = new ObjId(req.params.id);

  mydb.collection('post').findOne({ _id: new_id})
  .then(result => {
    console.log(result);
    res.render('content.ejs', { data : result });
  }).catch(err =>{
    console.log(err);
    res.status(500).send();
  });
});
app.get("/edit/:id", function (req, res) { 
  console.log(req.params.id);
  let new_id = new ObjId(req.params.id);

  mydb.collection('post').findOne({ _id: new_id})
  .then(result => {
    console.log(result);
    res.render('edit.ejs', { data : result });
  }).catch(err =>{
    console.log(err);
    res.status(500).send();
  });
});

//'/save' 요청에 대한 post 방식의 처리 루틴
app.post('/save', function(req, res){

  console.log(req.body.title);
  console.log(req.body.content);
  console.log(req.body.someDate);
  console.log(req.body.imagePath); // Assuming imagePath is sent in the request body

  let sql = "INSERT INTO post (title, content, someDate, imagePath, created) VALUES (?, ?, ?, ?, ?)";
  let params = [req.body.title, req.body.content, req.body.someDate, req.body.imagePath, new Date()];

  conn.query(sql, params, function (err, result) {
    if (err) {
      throw err;
    }
    console.log('데이터 추가 성공');
    res.send('데이터 추가 성공');
  });
});
// multer 설정: 문서 업로드
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/documents'); // 문서 파일 저장 경로
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const documentUpload = multer({ storage: documentStorage });

// 문서 업로드 라우트
app.post('/document', documentUpload.single('document'), (req, res) => {
  // req.file에 업로드된 문서 파일의 정보가 포함됨
  // 여기서 req.file.filename을 사용하여 문서 파일의 경로 또는 이름을 얻을 수 있음

  // MongoDB에 문서 경로 저장 (예시)
  const documentPath = '/documents/' + req.file.filename; // 문서 경로 설정
  mydb.collection('post').insertOne({
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString('KR'),
    documentPath: documentPath,
  })
    .then(result => {
      console.log('데이터 추가 성공');
      res.redirect('/listmongo');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});




// 문서 업로드 라우트
app.post('/document', documentUpload.single('document'), (req, res) => {
  // req.file에 업로드된 문서 파일의 정보가 포함됨
  // 여기서 req.file.filename을 사용하여 문서 파일의 경로 또는 이름을 얻을 수 있음

  // MongoDB에 문서 경로 저장 (예시)
  const documentPath = '/documents/' + req.file.filename; // 문서 경로 설정
  mydb.collection('post').insertOne({
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString('KR'),
    documentPath: documentPath,
  })
    .then(result => {
      console.log('데이터 추가 성공');
      res.redirect('/listmongo');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

app.post('/savemongo', function(req, res){
  console.log(req.body.title);
  console.log(req.body.content); 
  let now = new Date();
  mydb.collection('post').insertOne(
    {title : req.body.title, content : req.body.content, date : now.toLocaleDateString('KR')})
    .then(result => {
        console.log(result);
        console.log('데이터 추가 성공');
        res.redirect('/listmongo');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    })
});

app.post("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = new ObjId(req.body._id);
  mydb.collection('post').deleteOne(req.body)
  .then(result=>{
    console.log('삭제완료');
    res.status(200).send();
  })
  .catch(err =>{
    console.log(err);
    res.status(500).send();
  });
});

app.post('/edit', function(req, res){
  console.log(req.body.title);
  console.log(req.body.content);   
  let new_id = new ObjId(req.body.id);
  mydb.collection('post').updateOne({_id:new_id},
    {$set: {title : req.body.title, content : req.body.content, date : req.body.someDate}})
    .then(result => {        
        console.log('데이터 수정 성공');
        res.redirect('/listmongo');
    }); 
});

let cookieParser = require('cookie-parser')

app.use(cookieParser('ncvka0e398423kpfd'));
app.get('/cookie', function(req,res){
  let milk = parseInt(req.cookies.milk) + 1000;
  if(isNaN(milk))
  {
    milk = 0;
  }
  res.cookie("milk", milk, {maxAge : 1000});
  res.send("product: " + milk + "원");
});


let session = require('express-session');
app.use(session({
  secret : 'dkufe8938493j4e08349u',
  resave : false,
  saveUninitialized: true
}))


app.get("/session", function (req, res) {
  if(isNaN(req.session.milk)){
    req.session.milk = 0;
  }
  req.session.milk = req.session.milk + 1000;
  res.send("session : " + req.session.milk + "원");
});

//로그인 페이지 구현
app.get("/login", function (req, res) {
  console.log(req.session);
  if(req.session.user){
    console.log('세션 유지');
    res.render('index.ejs', {user : req.session.user });
  }else{
  res.render("login.ejs");
 }
});

app.post("/login", function (req, res) {
  console.log("아이디: " + req.body.userid);
  console.log("비밀번호 : " + req.body.userpw);

  mydb
      .collection("account")
      .findOne({userid: req.body.userid})
      .then((result) => {
        if(result.userpw == sha(req.body.userpw)){
          req.session.user = req.body;
          console.log('새로운 로그인');
          res.render('index.ejs', { user : req.session.user });
        }else{
          res.send('login.ejs');
        }
      });
});

// 로그아웃 구현
app.get("/logout", function(req, res) {
  console.log("로그아웃");
  req.session.destroy();
  res.render('index.ejs', {user : null});
});

// 회원가입 라우터 생성
app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

app.post("/signup", function(req, res) {
  console.log(req.body.userid);
  console.log(sha(req.body.userpw));
  console.log(req.body.usergroup);
  console.log(req.body.useremail);


  mydb
      .collection("account")
      .insertOne({
        userid: req.body.userid,
        userpw: sha(req.body.userpw),
        usergroup: req.body.usergroup,
        useremail: req.body.useremail,
      })
      .then((result) => {
        console.log("회원가입 성공");
      });
      res.redirect("/");
});


// multer 설정: 이미지 업로드
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images'); // 이미지 파일 저장 경로
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const imageUpload = multer({ storage: imageStorage });

// 이미지 업로드 라우트
app.post('/photo', imageUpload.single('picture'), (req, res) => {
  // req.file에 업로드된 이미지 파일의 정보가 포함됨
  // 여기서 req.file.filename을 사용하여 이미지 파일의 경로 또는 이름을 얻을 수 있음

  // MongoDB에 이미지 경로 저장 (예시)
  const imagePath = '/images/' + req.file.filename; // 이미지 경로 설정
  mydb.collection('post').insertOne({
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString('KR'),
    imagePath: imagePath,
  })
    .then(result => {
      console.log('데이터 추가 성공');
      res.redirect('/listmongo');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});
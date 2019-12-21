var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var FileReader = require('filereader')
var bitcoin = require("./modules/bitcoin");
const sharp = require('sharp');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser({defer: true}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(fileUpload({useTempFiles:false}));


app.post("/upload", async function(req, res, next){
  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {
          //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
          let file = req.files.file;
          var filename = req.body.tokenid + "." + file.name.split(".").pop();
                    //Use the mv() method to place the file in upload directory (i.e. "uploads")
          file.mv('c:/upload-images/original/' + filename, function(err){
            if (err)
              return res.status(500).send(err);
            
            var extension = file.name.split(".").pop();
            var resize = require('./modules/resize');
            let btoa = require("btoa");
            var buffer = btoa(file.data);

            try{
              if(!bitcoin("data:"+file.mimetype+";base64,"+buffer, req.body.signature, req.body.legacy))
              {
                return res.send({
                  status: false,
                  message: 'Not Verified Request'
                });
              }
            }
            catch(e){
              return res.send({
                status: false,
                message: 'Not Verified Request'
              });
            }
           
            
            async function func(){
              if(file.mimetype == "image/svg+xml")
              {
                var outputfilename = req.body.tokenid + "." + "png";
                await sharp("c:/upload-images/original/"+filename)
                  .resize(32, 32)
                  .toFormat("png")
                  .toFile("c:/upload-images/1/"+outputfilename)
                  .then(
                    (resolve) => { console.log("done") },
                    (err) => { console.log("error", err) }
                  );
                await sharp("c:/upload-images/original/"+filename)
                  .resize(64, 64)
                  .toFormat("png")
                  .toFile("c:/upload-images/2/"+outputfilename)
                  .then(
                    (resolve) => { console.log("done") },
                    (err) => { console.log("error", err) }
                  );
                await sharp("c:/upload-images/original/"+filename)
                  .resize(128, 128)
                  .toFormat("png")
                  .toFile("c:/upload-images/3/"+outputfilename)
                  .then(
                    (resolve) => { console.log("done") },
                    (err) => { console.log("error", err) }
                  );
                
              }
              else{
                await resize("c:/upload-images/original/"+filename, "c:/upload-images/1/"+filename, 32, 32, 90)
                .then(
                  (resolve) => {console.log("done");},
                  (err) => {}
                );
                await resize("c:/upload-images/original/"+filename, "c:/upload-images/2/"+filename, 64, 64, 90)
                  .then(
                    (resolve) => {console.log("done");},
                    (err) => {}
                  );
                await resize("c:/upload-images/original/"+filename, "c:/upload-images/3/"+filename, 128, 128, 90)
                  .then(
                    (resolve) => {console.log("done");},
                    (err) => {}
                  );
              }
              

                /*
              var git = require("./modules/git");
              await git.push("https://github.com/zhupingjin/image-repo", "./workiupload-images")
                  .then(
                    (resolve) => { console.log("git pushed"); },
                    (err) => {}
                  );
                  */
                const USER = 'zhupingjin';
                const PASS = 'learnforkorea19980609';
                const REPO = 'github.com/zhupingjin/image-repo';
                const remote = `https://${USER}:${PASS}@${REPO}`;

                require('simple-git')("c:/upload-images")
                          .add('./*')
                          .commit("first commit!")
                          .push('origin1', 'master');
/*
                const gitP = require('simple-git/promise');
                const git = gitP("c:/upload-images");



                git.checkIsRepo()
                  .then(isRepo => {
                    
                    if(!isRepo)
                    {
                      require('simple-git')("c:/upload-images")
                          .init()
                          .add('./*')
                          .commit("first commit!")
                          .addRemote('origin1', remote)
                          .push('origin1', 'master');
                    }
                    else
                    {
                      
                    }
                  });
                  */
                
/*
                await require('simple-git/promise')("./upload-images")
                 .init()
                 .add('./*')
                 .commit("first commit!")
                 .addRemote('origin1', remote)
                 .push('origin1', 'master');
                 */
                 /*
                await require('simple-git')("./upload-images")
                  .removeRemote("origin1");
                  */
            };
            
            func();
            
            res.send('File uploaded!');
          });
          /*
          let btoa = require("btoa");
          var buffer = btoa(file.data);

          //send response
          res.send({
              status: true,
              message: 'File is uploaded',
              data: {
                  name: file.name,
                  mimetype: file.mimetype,
                  size: file.size
              }
          });
          */
      }
  } catch (err) {
      res.status(500).send(err);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/*
app.route('/upload')
.post(function (req, res, next) {
  
  var form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = "./img";       //set upload directory
    form.keepExtensions = true;     //keep file extension
});
*/

module.exports = app;

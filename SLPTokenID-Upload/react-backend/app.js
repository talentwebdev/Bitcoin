require('dotenv').config()

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

// git module
const Octokat = require("octokat");
const git_helper = require("./modules/git-helper");
const helper = git_helper.init(new Octokat({
  username: process.env.GITHUB_USERNAME, 
  password: process.env.GITHUB_PASSWORD
}));

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
          file.mv('./upload-images/' + filename, function(err){
            if (err)
              return res.status(500).send(err);
            
            var extension = file.name.split(".").pop();
            var resize = require('./modules/resize');
            let btoa = require("btoa");
            var buffer = btoa(file.data);

            // verify the upload request
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
              var outputfilename = req.body.tokenid + "." + "png";
              
              // copy and optimize the images
              await sharp("./upload-images/"+filename)
                .resize(32, 32)
                .toFormat("png")
                .toFile("./slp-token-icons/32/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );
              

              await sharp("./upload-images/"+filename)
                .resize(64, 64)
                .toFormat("png")
                .toFile("./slp-token-icons/64/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );

              await sharp("./upload-images/"+filename)
                .resize(128, 128)
                .toFormat("png")
                .toFile("./slp-token-icons/128/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );

                /*
              await sharp("./upload-images/"+filename)
                .toFormat("png")
                .toFile("./slp-token-icons/original/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );            
                */
              
              //
              var changeSetArray = [
                // 32 * 32
                {
                  delete: false,
                  new: true,
                  path: "32/" + outputfilename, 
                  payload: await git_helper.readfile("./../slp-token-icons/32/"+outputfilename)
                },
                // 64 * 64
                {
                  delete: false,
                  new: true,
                  path: "64/" + outputfilename, 
                  payload: await git_helper.readfile("./../slp-token-icons/64/"+outputfilename)
                },
                // 128 * 128
                {
                  delete: false,
                  new: true,
                  path: "128/" + outputfilename, 
                  payload: await git_helper.readfile("./../slp-token-icons/128/"+outputfilename)
                },
                // original image
                {
                  delete: false,
                  new: true,
                  path: (file.mimetype == "image/svg+xml" ? ("svg/" + filename) : ("original/" + filename)), 
                  payload: await git_helper.readfile("./../upload-images/" + filename)
                }
              ]

              try{
                await helper.push(process.env.GITHUB_USERNAME, "newBranch", "SLP Token Icon Commit", null, changeSetArray, false);
                console.log("file uploaded");
                res.send('File uploaded!');
              }catch(e)
              {
                res.send("Can not submit ");
                console.log(e);
                return;
              }
            };
            
            func();
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
module.exports = app;

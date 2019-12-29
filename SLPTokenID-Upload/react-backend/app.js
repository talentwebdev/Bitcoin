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

// github api module
const Octokat = require("octokat");
const git_helper = require("./modules/git-helper");
const helper = git_helper.init(new Octokat({
  username: process.env.GITHUB_USERNAME, 
  password: process.env.GITHUB_PASSWORD
}));
var repo_fork = null;

// git module
const git = require("./modules/git")
const simplegit_helper = git.init({
  work_dir: "./" + process.env.GIT_WORKDIR,
  repo_name: process.env.ORIGIN_REPO
});
var isCloned = false;
console.log(process.env.GITHUB_USERNAME);
console.log(process.env.GITHUB_PASSWORD);

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

          if(repo_fork == null)
          {
            return res.send("Not Configured");
          }
          //Use the mv() method to place the file in upload directory (i.e. "uploads")
          var filepath = file.mimetype == "image/svg+xml" ? ("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/svg/") : 
                                      ("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/original/") ;

          file.mv(filepath + filename, function(err){
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
              await sharp(filepath+filename)
                .resize(32, 32)
                .toFormat("png")
                .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/32/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );
              

              await sharp(filepath + filename)
                .resize(64, 64)
                .toFormat("png")
                .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/64/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }  
                );

              await sharp(filepath + filename)
                .resize(128, 128)
                .toFormat("png")
                .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/128/"+outputfilename)
                .then(
                  (resolve) => { console.log("done") },
                  (err) => { console.log("error", err) }
                );

              // push content
              console.log("pushing updates ... ");
              const commitMessage = `adding ${req.body.tokenname}`;
              const commit = await simplegit_helper.push(commitMessage, process.env.GITHUB_BRANCHNAME);  
              console.log("pushied updates: ", commit.commit);
              const sha_commit = await helper.getFullShaCommit(repo_fork, commit.commit, process.env.GITHUB_BRANCHNAME)
              const comment = `Message: \n \`\`\`${req.body.tokenid}\`\`\` \n Genesis Address: \n \`\`\`${req.body.legacy}\`\`\` \n Signature: \n \`\`\`${req.body.signature}\`\`\``;
              if(sha_commit != "")
              {
                console.log("adding comment");
                await helper.addComment(repo_fork, sha_commit, comment);
                console.log("comment added")
                await helper.doPullRequestAndMerge(process.env.GITHUB_BRANCHNAME, process.env.GITHUB_USERNAME, commitMessage, null, false);
                console.log("created pull request")
              }
              
              console.log("All Done");
              return res.send("File uploaded");
              
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

// get fork repo
async function gitInit()
{
  await helper.createNewBranch(repo_fork, process.env.GITHUB_BRANCHNAME);

  // clone repo
  try{
    await simplegit_helper.clone();
    console.log("Repo Cloned");
    isCloned = true;  
  }catch(error)
  {

  }
  

}
helper.forkRepo(process.env.GITHUB_USERNAME)
  .then(fork => { 
    repo_fork = fork; 

    gitInit();
  });

module.exports = app;

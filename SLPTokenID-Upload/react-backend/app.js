require('dotenv').config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const bitcoin = require("./modules/bitcoin");
const sharp = require('sharp');
const btoa = require("btoa");
const sha256 = require('sha256');
//const hash = require("object-hash");

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
console.log(process.env.GITHUB_USERNAME);
console.log(process.env.GITHUB_PASSWORD);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser({defer: true}));
app.use(fileUpload({useTempFiles:false}));


app.post("/upload", async function(req, res, next){
  try {
      if(!req.files) {
          return res.json({
              status: false,
              message: 'No file uploaded'
          });
      } else {

          // check if the tokenid and genesis addres is validate
          if(req.body.tokenid === null | undefined)
          {
            return res.json({
              status: false,
              message: "No Token ID"
            });
          }
          let genesis_address = await bitcoin.getSLPAddressFromTokenID(req.body.tokenid);
          if(req.body.legacy != bitcoin.getLegacyFromSLPAddress(genesis_address))
          {
            return res.json({
              status: false,
              message: "Invalidate Genesis Address"
            });
          }

          
          // upload files
          let file = req.files.file;

           // verify the upload request
           try{
            if(!bitcoin.verifyMessage(sha256(file.data), req.body.signature, req.body.legacy))
            {
              return res.json({
                status: false,
                message: 'Not Verified Request'
              });
            }
          }
          catch(e){
            return res.json({
              status: false,
              message: 'Not Verified Request'
            });
          }

          // check if the repo-fork is done
          if(repo_fork == null)
          {
            return res.json({status: false, message: "Not Configured"});
          }

          
          if(file.mimetype !== "image/svg+xml" 
              && file.mimetype !== "image/png"
              && file.mimetype !== "image/jpeg")
          {
            return res.json({status: false, message: "Not available image type"});
          }

          var filepath = file.mimetype == "image/svg+xml" ? ("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/svg/") : 
                                      ("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/original/") ;         
          var filename = req.body.tokenid + "." + (file.mimetype === "image/jpeg" ? 'png' : file.name.split(".").pop());
          
          async function submitPR(){
            var outputfilename = req.body.tokenid + "." + "png";
            
            // copy and optimize the images
            await sharp(new Buffer(file.data.buffer))
              .resize(32, 32)
              .toFormat("png")
              .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/32/"+outputfilename)
              .then(
                (resolve) => { console.log("done") },
                (err) => { console.log("error", err) }
              );
            

            await sharp(new Buffer(file.data.buffer))
              .resize(64, 64)
              .toFormat("png")
              .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/64/"+outputfilename)
              .then(
                (resolve) => { console.log("done") },
                (err) => { console.log("error", err) }  
              );

            await sharp(new Buffer(file.data.buffer))
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
            return res.json({status: true, message: "File uploaded"});
            
          };
          
          if(file.mimetype === "image/svg+xml" || file.mimetype === "image/png")
          {
            file.mv(filepath + filename, function(err){
              if (err)
                return res.json({status: false, message: "File Upload error", error: err});
                
              submitPR();
            });
          }
          else {
            await sharp(new Buffer(file.data.buffer))
              .toFormat('png')
              .toFile(filepath + filename)
              .then(
                (resolve) => { submitPR(); },
                (err) => { console.log("error", err); }
              )
          }
          
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

  return res.json({status: err.status || 500, message: "error"});
});

// get fork repo
async function gitInit()
{
  await helper.createNewBranch(repo_fork, process.env.GITHUB_BRANCHNAME);

  // clone repo
  try{
    await simplegit_helper.clone();
    console.log("Repo Cloned");
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

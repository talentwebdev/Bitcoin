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
          let legacy = bitcoin.getLegacyFromSLPAddress(req.body.slpaddress);
          if(req.body.slpaddress != genesis_address)
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
            if(!bitcoin.verifyMessage(sha256(file.data), req.body.signature, legacy))
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
            //var filecontent = (file.mimetype == "image/svg+xml" ? (filepath + filename) : new Buffer(file.data.buffer));
            const fs = require('fs');
            var readFileSync = fs.readFileSync(filepath + filename);
            //var filecontent = new Buffer.from(file.data.buffer);
            console.log("32*32");
            var error = await sharp(readFileSync)
              .resize(32, 32)
              .toFormat("png")
              .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/32/"+outputfilename)
              .then(data => {console.log("done", data)})
              .catch(err => { console.log("error", err)});
            
            console.log("64*64");
            await sharp(readFileSync)
              .resize(64, 64)
              .toFormat("png")
              .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/64/"+outputfilename)
              .then(data => {console.log("done", data)})
              .catch(err => { console.log("error", err)});

            console.log("128*128");
            await sharp(readFileSync)
              .resize(128, 128)
              .toFormat("png")
              .toFile("./" + process.env.GIT_WORKDIR + "/" + process.env.ORIGIN_REPO + "/128/"+outputfilename)
              .then(data => {console.log("done", data)})
              .catch(err => { console.log("error", err)});

            // push content
            console.log("pushing updates ... ");
            const commitMessage = `adding ${req.body.tokenname}`;
            console.log("pulling ... ");
            await simplegit_helper.pull(process.env.GITHUB_BRANCHNAME);
            console.log("pulling done ");
            const commit = await simplegit_helper.push(commitMessage, process.env.GITHUB_BRANCHNAME);  
            console.log("pushied updates: ", commit.commit);
            const sha_commit = await helper.getFullShaCommit(repo_fork, commit.commit, process.env.GITHUB_BRANCHNAME)
            const comment = `Message: \n \`\`\`${req.body.tokenid}\`\`\` \n Genesis Address: \n \`\`\`${req.body.slpaddress}\`\`\` \n Signature: \n \`\`\`${req.body.signature}\`\`\``;
            if(sha_commit != "")
            {
              console.log("adding comment");
              await helper.addComment(repo_fork, sha_commit, comment);
              console.log("comment added")
              await helper.doPullRequestAndMerge(process.env.GITHUB_BRANCHNAME, process.env.GITHUB_USERNAME, commitMessage, null, false);
              console.log("created pull request")
              console.log("All Done");
              return res.json({status: true, message: "File uploaded"});
            }
            
            return res.json({status: false, message: "Can not commit updates"});
            
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
              .toFile(filepath + filename);

              submitPR();
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
  // check if the git directory exists, if exists remove them
  const fs = require('fs');
  let path = "./"+process.env.GIT_WORKDIR+"/"+process.env.ORIGIN_REPO;
  if(fs.existsSync(path))
  {
    /*
    console.log("previous git folder exists, removing them ... ");
    var rimraf = require("rimraf");
    rimraf.sync(path);
    console.log("removed");
    */
   return;
  }

  await helper.createNewBranch(repo_fork, process.env.GITHUB_BRANCHNAME);

  // clone repo
  try{
    console.log("repo cloning ...");
    await simplegit_helper.clone();
    console.log("Repo Cloned");
  }catch(error)
  {
    console.log("repo cloning error : ", error);
  }
}
async function forkRepo()
{
  // check if the repo has been already forked
  let octokat = new Octokat({
    username: process.env.GITHUB_USERNAME, 
    password: process.env.GITHUB_PASSWORD
  });
  let repo = await octokat.repos(process.env.GITHUB_USERNAME, process.env.ORIGIN_REPO).fetch();
  if(repo.source == undefined || repo.parent == undefined)
  {
    console.log("forking .... ");
    helper.forkRepo(process.env.GITHUB_USERNAME)
      .then(fork => { 
        console.log("repo is successfuly forked");
        repo_fork = fork; 

        gitInit();
      });  
  }
  else
  {
    repo_fork = repo;
    gitInit();
  }
}


forkRepo();
module.exports = app;

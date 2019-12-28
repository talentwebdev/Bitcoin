const Octokat = require('octokat')
const Promise = require('bluebird')

//const ORIGIN_USERNAME = 'zhupingjin'
//const ORIGIN_REPO = 'https://github.com/zhupingjin/image-repo'
const ORIGIN_USERNAME = process.env.ORIGIN_USERNAME
const ORIGIN_REPO = process.env.ORIGIN_REPO
const ORIGIN_BRANCH = process.env.ORIGIN_BRANCH
const WAIT_FOR_FORK = process.env.WAIT_FOR_FORK
const WAIT_FOR_MERGE = process.env.WAIT_FOR_MERGE

// support nodejs and browser runtime
var base64Encode = function(content) {
  if (typeof btoa !== 'undefined') {
    return btoa(content)
  } else {
    return new Buffer(content).toString('base64')
  }
}
var readfile = async function(filename){
  return new Promise((resolve, reject) => {
    var fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, filename);


    fs.readFile(filePath, function(err,data){
        if (!err) {
            //console.log('received data: ' + data);

            resolve(data);
        } else {
            reject(err);
        }
    });
  })
}
const init = function(octo) {

  const helper = {}

  const originRepo = octo.repos(ORIGIN_USERNAME, ORIGIN_REPO)

  helper.addcontent = Promise.coroutine(function*(filename, username, repo, commitMessage, branchName){
    // sample octo.repos("zhupingjin", "iamge-repo")
    const currentrepo = octo.repos(username, repo)
   
    var changeSetArray = [
        {
        delete: false,
        new: true, 
        path: "123/svg.png",
        payload: yield readfile(filename)
      }
    ]

    yield helper.commitChanges(currentrepo, branchName, changeSetArray, commitMessage);
  })
  
  helper.push = Promise.coroutine(function*(username, branchName, commitMessage, prBody, changeSetArray, autoMerge) {
    const fork = yield helper.forkRepo(username)
    yield helper.createNewBranch(fork, branchName)
    yield helper.commitChanges(fork, branchName, changeSetArray, commitMessage)
    return yield helper.doPullRequestAndMerge(branchName, username, commitMessage, prBody, autoMerge)
  })

  helper.forkRepo = Promise.coroutine(function*(username) {
    let fork = null
    yield originRepo.forks.create()
    var tryCounter = 0
    while (fork == null && tryCounter < WAIT_FOR_FORK) {
      console.log('waiting until repo is forked')
      yield Promise.delay(tryCounter * 1000)
      fork = yield octo.repos(username, ORIGIN_REPO).fetch()
      tryCounter++
    }
    if (fork == null) {
      console.error('could not fork the origin repo')
      return null
    }
    return fork
  })

  helper.createNewBranch = Promise.coroutine(function*(fork, branchName) {
    var forkCommits = yield fork.commits.fetch({sha: 'master'})
    var originCommits = yield originRepo.commits.fetch({sha: 'master'})
    if (originCommits.items[0].sha != forkCommits.items[0].sha) {
      console.log('master branch of fork is not in sync, force updating from upstream')
      yield fork.git.refs('heads/master').update({
        force: true,
        sha: originCommits.items[0].sha
      })
    }
    var allBranches = yield fork.git.refs.fetch()
    var branch = allBranches.items.filter(function(item) {
      var name = item.ref.split('/')[2] // refs/heads/master -> master
      return name === branchName
    })[0]
    if (branch == null) {
      console.log('creating branch')
      var branch = yield fork.git.refs.create({
        ref: 'refs/heads/' + branchName,
        sha: originCommits.items[0].sha // recent commit SHA
      })
    }
    return originCommits.items[0].sha
  })

  helper.commitChanges = Promise.coroutine(function*(fork, branchName, changeSetArray, commitMessage) {
    const changed =  {added: 0, updated: 0, deleted: 0}
    for (var i=0; i<changeSetArray.length; i++) {
      var changeset = changeSetArray[i]
      var config = {
        message: commitMessage + '(' + (i+1) + '/' + changeSetArray.length + ')',
        content: changeset.delete ? undefined : base64Encode(changeset.payload),
        branch: branchName
      }
      try {
        console.log('try to fetching sha from', changeset.path)
        var meta = yield fork.contents(changeset.path).fetch({ref: branchName})
        config.sha = meta.sha
      } catch (err) {
        // file seems to be new, so there is no SHA1
        console.log(err);
      }
      if (changeset.delete) {
        yield fork.contents(changeset.path).remove(config)
        changed.deleted++
        console.log('deleted file', changeset.path)
      } else {
        try{
          yield fork.contents(changeset.path).add(config)  
        }catch(err)
        {
          console.log(err);
        }
        
        if (changeset.new) {
          changed.added++
          console.log('added new file', changeset.path)
        } else {
          changed.updated++
          console.log('updated file', changeset.path)
        }
      }
    }
    return
  })

  helper.mergePullRequest = Promise.coroutine(function*(pullRequest, counter, max) {
    if (counter >= max) {
      throw new Error('could not merge pull request')
    }
    try {
      return yield originRepo.pulls(pullRequest.number).merge.add({
        // commitMessage: 'optional message',
        sha: pullRequest.head.sha
      })
    } catch (err) {
      // seems that GitHub is not ready for the merge, just wait and try again
      // https://github.com/githubteacher/welcome-june/issues/127
      if (err.json != null && err.json.message === 'Base branch was modified. Review and try the merge again.') {
        return null
      }
      throw err
    }
  })

  helper.doPullRequestAndMerge = Promise.coroutine(function*(branchName, username, commitMessage, prBody, autoMerge) {
    console.log('checking pulll requests')
    var pullRequestArray = yield originRepo.pulls.fetch({head: username + ':' + branchName})
    console.log("checking pull request finished:", pullRequestArray);
    if (pullRequestArray.items.length === 0) {
      console.log('creating pulll request')
      const pullRequest = yield originRepo.pulls.create({
        title: commitMessage,
        body: prBody,
        head: username + ":" + branchName,
        base: ORIGIN_BRANCH
      })
      var merged = null
      var message = null
      var mergeResult = null
      if (autoMerge) {
        // MERGE BUTTON
        var counter = 0
        var mergeResult = null
        while (mergeResult == null) {
          console.log('try to merge pull request', pullRequest.number, pullRequest.head.sha)
          yield Promise.delay(1000 * counter)
          mergeResult = yield mergePullRequest(pullRequest, counter++, WAIT_FOR_MERGE)
        }
        if (mergeResult.merged) {
          merged = true,
          message = 'merged'
        } else {
          merged = false,
          message = mergeResult.message
        }
      }
      return {
        ok: true,
        created: true,
        merged: merged,
        message: message,
        pr: pullRequest,
      }
    } else {
      return {
        created: false,
        pr: pullRequestArray
      }
    }
  })


  helper.addComment = Promise.coroutine(function*(fork, sha_commit, comment){

    fork.commits(sha_commit).comments.create({
      body: comment
    })
  })

  helper.getFullShaCommit = Promise.coroutine(function*(fork, sha, branchName){
    var commits = yield fork.commits.fetch()

    for(var i = 0 ; i < commits.items.length ; i++)
    {
      if(sha != "" && commits.items[i].sha.indexOf(sha) == 0)
      {
        return commits.items[i].sha
      }
    }
    return ""
  })

  return helper
}

module.exports = function(token) {
  return init(new Octokat({token: token}))
}
module.exports.init = init
module.exports.readfile = readfile;
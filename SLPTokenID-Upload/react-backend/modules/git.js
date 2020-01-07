const simple_git = require("simple-git/promise")
const USER = process.env.GITHUB_USERNAME
const TOKEN = process.env.GITHUB_TOKEN

function init(opts)
{   
    const helper = {}

    const options = {...opts};
    const remote = `https://${USER}:${TOKEN}@${'github.com/'+USER+"/"+options.repo_name}`
    console.log(remote)

    helper.clone = function()
    {
        console.log("work_dir", options.work_dir)
        return simple_git(options.work_dir).silent(true)
                .clone(remote)
    }

    helper.push = async function(commitMessage, branchName)
    {
        var commit = {}
        return new Promise((resolve) => {
            require("simple-git")(options.work_dir+"/"+options.repo_name).silent(true)
                            .add("./*")
                            .commit(commitMessage, (err, data) => {commit = data;})
                            .push(['-u', 'origin', branchName], (err, data) => { console.log("pushed", data); resolve(commit) })
        })
    }

    helper.pull = async function(branchName)
    {
        return new Promise((resolve) => {
            require("simple-git")(options.work_dir+"/"+options.repo_name).silent(true)
                                .pull("origin", branchName, (err, data) => { resolve(); })
        })
    }

    helper.log = async function()
    {
        return new Promise((resolve) => {
            require("simple-git")(options.work_dir+"/"+options.repo_name).silent(true)
                            .log((data) => {console.log("log", data)})
        })
    }

    return helper
}

module.exports.init = init 
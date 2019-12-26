
async function push(workingpath, remote)
{
    return new Promise( (resolve, reject) => {
        require('simple-git')(workingpath)
            .init()
            .add('./*')
            .commit("Commit!")
            .push(remote, 'master');
        resolve();

    });
}

async function clone(repoPath)
{
    const remote = 'https://zhupingjin:aaaaassss10081423!@#$@github.com/zhupingjin/slp-token-icons';

    return new Promise( (resolve) => {
        require('simple-git')()
            .clone(repoPath);
        resolve();
    });
}

async function addRemote(workingpath, remotename)
{
    const remote = 'https://zhupingjin:aaaaassss10081423!@#$@github.com/zhupingjin/slp-token-icons';

    return new Promise( (resolve) => {
        require('simple-git')(workingpath)
            .addRemote(remotename, 'https://zhupingjin:aaaaassss10081423!@#$@github.com/zhupingjin/slp-token-icons');
        resolve();
    });
}

module.exports = {
    push: push,
    clone: clone,
    addRemote: addRemote
}
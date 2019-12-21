
export async function push(gitaddr, workingpath)
{
    return new Promise( (resolve) => {
        require('simple-git')(workingpath)
            .init()
            .add('./*')
            .commit("first commit!")
            .addRemote('origin', gitaddr)
            .push('origin', 'master');
        resolve();
    });
}
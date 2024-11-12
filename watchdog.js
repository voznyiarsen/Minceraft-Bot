const { spawn } = require('child_process');

const [,, host, username, password, master] = process.argv;

if (process.argv.length < 6) {
    console.log('Usage watchdog.js [host] [username] [password] [master]');
    process.exit(1);
}

function startApp() {
    const childProcess = spawn('node', ['index.js', host, username, password, master], { stdio: 'inherit', shell: true });

    childProcess.on('exit', (code) => {
        if (code != 0) {
            console.log(`App exited with code ${code}. Restarting...`);
            startApp();
        }
    }).on('error', (err) => {
        console.error(`Failed to start subprocess: ${err}`);
    });
}

startApp();
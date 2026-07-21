const { spawn, execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

// Helper to check if a port is in use / service running
function checkMongoDB(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(1000);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

async function run() {
  // 1. Check/Install dependencies
  const clientModules = path.join(__dirname, 'client', 'node_modules');
  const serverModules = path.join(__dirname, 'server', 'node_modules');

  if (!fs.existsSync(clientModules) || !fs.existsSync(serverModules)) {
    console.log('\n\x1b[33m[Warning] Missing node_modules in frontend or backend.\x1b[0m');
    console.log('\x1b[33mRunning npm install across all projects... This may take a minute.\x1b[0m\n');
    try {
      if (!fs.existsSync(clientModules)) {
        console.log('\x1b[36mInstalling frontend dependencies...\x1b[0m');
        execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
      }
      if (!fs.existsSync(serverModules)) {
        console.log('\x1b[35mInstalling backend dependencies...\x1b[0m');
        execSync('npm install', { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });
      }
      console.log('\n\x1b[32m✓ All dependencies installed successfully!\x1b[0m\n');
    } catch (err) {
      console.error('\x1b[31m[Error] Failed to install dependencies:\x1b[0m', err.message);
      process.exit(1);
    }
  }

  // 2. Setup port defaults & read from server environment
  let clientPort = 5173;
  let serverPort = 5050;
  let mongoUri = '';

  try {
    const envPath = path.join(__dirname, 'server', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
      if (portMatch) {
        serverPort = parseInt(portMatch[1], 10);
      }
      const mongoMatch = envContent.match(/^MONGO_URI\s*=\s*(.+)/m);
      if (mongoMatch) {
        mongoUri = mongoMatch[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Check MongoDB connection
  const isRemoteMongo = mongoUri.includes('mongodb+srv://') || (mongoUri && !mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost'));

  if (isRemoteMongo) {
    console.log('\x1b[32m✓ Configured for MongoDB Atlas database!\x1b[0m\n');
  } else {
    console.log('\x1b[34mChecking MongoDB connection (port 27017)...\x1b[0m');
    let mongoRunning = await checkMongoDB(27017, '127.0.0.1');
    if (!mongoRunning) {
      console.log('\n\x1b[33m[Warning] MongoDB is not running on localhost:27017.\x1b[0m');
      console.log('\x1b[34mAttempting to start MongoDB service automatically...\x1b[0m');
      try {
        if (process.platform === 'darwin') {
          execSync('brew services start mongodb-community', { stdio: 'ignore' });
        } else if (process.platform === 'linux') {
          execSync('sudo systemctl start mongod', { stdio: 'ignore' });
        }
        await new Promise(r => setTimeout(r, 2000));
        mongoRunning = await checkMongoDB(27017, '127.0.0.1');
      } catch (err) {
        // Fall through
      }
    }

    if (!mongoRunning) {
      console.log('\n\x1b[31m[Error] Local MongoDB is not running on localhost:27017.\x1b[0m');
      console.log('\x1b[33mPlease start MongoDB manually or update server/.env with your MONGO_URI.\x1b[0m\n');
    } else {
      console.log('\x1b[32m✓ Local MongoDB is running successfully!\x1b[0m\n');
    }
  }

  // 4. Start Frontend & Backend
  console.log('\x1b[36mSpawning Frontend dev server...\x1b[0m');
  const clientProc = spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'client'), shell: true });

  console.log('\x1b[35mSpawning Backend API server...\x1b[0m');
  const serverProc = spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'server'), shell: true });

  let clientReady = false;
  let serverReady = false;
  let startupPrinted = false;

  function printStartupInfo() {
    if (clientReady && serverReady && !startupPrinted) {
      startupPrinted = true;
      setTimeout(() => {
        console.log('Frontend:');
        console.log(`http://localhost:${clientPort}`);
        console.log('');
        console.log('Backend:');
        console.log(`http://localhost:${serverPort}`);
        console.log('');
      }, 500);
    }
  }

  // Handle Client Output
  clientProc.stdout.on('data', (data) => {
    const str = data.toString();
    const urlMatch = str.match(/http:\/\/localhost:(\d+)/) || str.match(/http:\/\/127\.0\.0\.1:(\d+)/);
    if (urlMatch) {
      clientPort = parseInt(urlMatch[1], 10);
    }
    if (str.includes('Local:') || str.includes('5173') || str.includes('dev server') || str.includes('ready')) {
      clientReady = true;
      printStartupInfo();
    }
    str.trim().split('\n').forEach(line => {
      if (line.trim()) console.log(`\x1b[36m[Client]\x1b[0m ${line}`);
    });
  });

  clientProc.stderr.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => {
      if (line.trim()) console.error(`\x1b[36m[Client] [Error]\x1b[0m ${line}`);
    });
  });

  // Handle Server Output
  serverProc.stdout.on('data', (data) => {
    const str = data.toString();
    const portMatch = str.match(/port (\d+)/i) || str.match(/listening on (\d+)/i);
    if (portMatch) {
      serverPort = parseInt(portMatch[1], 10);
    }
    if (str.includes('5050') || str.includes('connected') || str.includes('database') || str.includes('DB') || str.includes('listening')) {
      serverReady = true;
      printStartupInfo();
    }
    str.trim().split('\n').forEach(line => {
      if (line.trim()) console.log(`\x1b[35m[Server]\x1b[0m ${line}`);
    });
  });

  serverProc.stderr.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => {
      if (line.trim()) console.error(`\x1b[35m[Server] [Error]\x1b[0m ${line}`);
    });
  });

  // Handle graceful exits
  const cleanExit = () => {
    console.log('\n\x1b[33mShutting down servers and processes...\x1b[0m');
    clientProc.kill();
    serverProc.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);

  clientProc.on('close', (code) => {
    console.log(`\x1b[36m[Client]\x1b[0m exited with code ${code}`);
    serverProc.kill();
    process.exit(code);
  });

  serverProc.on('close', (code) => {
    console.log(`\x1b[35m[Server]\x1b[0m exited with code ${code}`);
    clientProc.kill();
    process.exit(code);
  });
}

run();

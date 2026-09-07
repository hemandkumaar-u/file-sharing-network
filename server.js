const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const { getPrimaryIp, getLocalIps } = require('./utils/network');
const { setupTunnel } = require('./utils/tunnel');
const createApiRouter = require('./routes/api');

const app = express();
const port = 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        let originalName = file.originalname;
        let ext = path.extname(originalName);
        let base = path.basename(originalName, ext);
        
        let filename = originalName;
        let counter = 1;
        while (fs.existsSync(path.join(uploadDir, filename))) {
            filename = `${base}_${counter}${ext}`;
            counter++;
        }
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Global app state
app.locals.tunnelUrl = null;
app.locals.primaryIp = null;

// Middleware for routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(uploadDir));

// API Router
app.use('/api', createApiRouter(uploadDir, upload, port));

async function startServer() {
    app.locals.primaryIp = await getPrimaryIp();

    app.listen(port, '0.0.0.0', async () => {
        console.log('\n==================================================');
        console.log('Starting Server & Public Tunnel (Firewall Bypass)...');
        console.log('Please wait a few seconds...');
        
        app.locals.tunnelUrl = await setupTunnel(port);

        console.log('\n==================================================');
        console.log('Server is running!');
        console.log('==================================================');
        
        console.log('\nAvailable Network Interfaces:');
        getLocalIps().forEach(ip => {
            const isPrimary = ip.address === app.locals.primaryIp ? '(Active)' : '';
            console.log(`  - ${ip.name}: http://${ip.address}:${port} ${isPrimary}`);
        });
        
        if (app.locals.tunnelUrl) {
            console.log(`  - Public Internet: ${app.locals.tunnelUrl}`);
        }
        
        const dropUrl = app.locals.tunnelUrl 
            ? `${app.locals.tunnelUrl}/drop.html` 
            : `http://${app.locals.primaryIp}:${port}/drop.html`;
            
        console.log('\nScan this QR code with your phone:');
        console.log(`Drop URL: ${dropUrl}`);
        
        qrcode.generate(dropUrl, {small: true}, function (qrcode) {
            console.log(qrcode);
        });

        console.log('\n==================================================');
        console.log(`Desktop UI: Open http://localhost:${port} in your PC browser`);
        console.log('Press CTRL+C to stop the server.');
        console.log('==================================================\n');
    });
}

startServer();

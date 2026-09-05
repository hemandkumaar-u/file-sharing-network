const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getLocalIps } = require('../utils/network');

function createApiRouter(uploadDir, upload, port) {
    // API endpoint to list all files
    router.get('/files', (req, res) => {
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to read uploads directory' });
            }
            const fileData = files.map(filename => {
                const stats = fs.statSync(path.join(uploadDir, filename));
                return {
                    name: filename,
                    size: stats.size,
                    time: stats.mtime.getTime(),
                    url: `/files/${encodeURIComponent(filename)}`
                };
            });
            
            fileData.sort((a, b) => b.time - a.time);
            res.json(fileData);
        });
    });

    // Upload endpoint
    router.post('/upload', upload.array('file'), (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const savedFiles = req.files.map(f => f.filename);
        res.status(200).json({ 
            success: true, 
            message: `Successfully uploaded ${savedFiles.length} file(s)`, 
            files: savedFiles 
        });
    });

    // Config endpoint
    router.get('/config', (req, res) => {
        const allIps = getLocalIps();
        if (req.app.locals.tunnelUrl) {
            allIps.push({ name: 'Public Internet (Firewall Bypass)', address: req.app.locals.tunnelUrl });
        }
        res.json({
            primaryIp: req.app.locals.primaryIp,
            allIps: allIps,
            port: port
        });
    });
    
    return router;
}

module.exports = createApiRouter;

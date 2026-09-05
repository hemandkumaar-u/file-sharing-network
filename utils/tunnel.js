const { startTunnel } = require('untun');

async function setupTunnel(port) {
    try {
        const tunnel = await startTunnel({ port });
        const tunnelUrl = await tunnel.getURL();
        return tunnelUrl;
    } catch (err) {
        console.log('Failed to start cloudflare tunnel:', err.message);
        return null;
    }
}

module.exports = { setupTunnel };

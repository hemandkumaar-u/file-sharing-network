const os = require('os');
const dgram = require('dgram');

function getLocalIps() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({name: name, address: iface.address});
            }
        }
    }
    return ips;
}

function getPrimaryIp() {
    return new Promise((resolve) => {
        const socket = dgram.createSocket('udp4');
        socket.on('error', () => {
            socket.close();
            resolve(getLocalIps()[0]?.address || '127.0.0.1');
        });
        socket.connect(53, '8.8.8.8', () => {
            const activeIp = socket.address().address;
            socket.close();
            resolve(activeIp);
        });
    });
}

module.exports = { getLocalIps, getPrimaryIp };

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videos = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const docs = ['pdf', 'doc', 'docx', 'txt'];
    
    if (images.includes(ext)) return '🖼️';
    if (videos.includes(ext)) return '🎥';
    if (docs.includes(ext)) return '📄';
    return '📁';
}

let currentPort = 3000;
let knownIps = ""; // To track if we need to rebuild the dropdown

function updateQRCode(ip) {
    let url = '';
    // If the IP is a localtunnel/cloudflare URL, don't append the port
    if (ip.startsWith('https://')) {
        url = `${ip}/drop.html`;
    } else {
        url = `http://${ip}:${currentPort}/drop.html`;
    }
    
    document.getElementById('qrurl').textContent = url;
    document.getElementById('qrcode').innerHTML = ''; // clear previous
    new QRCode(document.getElementById("qrcode"), {
        text: url,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

function fetchConfig() {
    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            currentPort = data.port;
            const newIps = data.allIps.map(i => i.address).join(',');
            
            // Only rebuild dropdown if the available IPs changed (e.g. tunnel connected)
            if (knownIps !== newIps) {
                knownIps = newIps;
                const selector = document.getElementById('ipSelector');
                
                // Remember currently selected value
                const prevSelected = selector.value;
                
                selector.innerHTML = ''; 
                
                // Populate dropdown
                let hasPublic = false;
                data.allIps.forEach(ip => {
                    const option = document.createElement('option');
                    option.value = ip.address;
                    option.textContent = ip.name.includes('Public Internet') ? ip.name : `${ip.name} (${ip.address})`;
                    if (ip.address === prevSelected || (!prevSelected && ip.address === data.primaryIp)) {
                        option.selected = true;
                    }
                    if (ip.name.includes('Public Internet')) {
                        hasPublic = true;
                        // Auto-select public internet when it becomes available for the first time
                        if (prevSelected === "Loading...") {
                            option.selected = true;
                        }
                    }
                    selector.appendChild(option);
                });
                
                // Regenerate QR code based on the new selection
                updateQRCode(selector.value || data.primaryIp || data.allIps[0]?.address || '127.0.0.1');
                
                // Add event listener once when rebuilding
                selector.addEventListener('change', (e) => {
                    updateQRCode(e.target.value);
                });
            }
        })
        .catch(err => console.error("Error fetching config:", err));
}

function fetchFiles() {
    fetch('/api/files')
        .then(res => res.json())
        .then(files => {
            const grid = document.getElementById('filesGrid');
            document.getElementById('fileCount').textContent = files.length;
            
            if (files.length === 0) {
                grid.innerHTML = '<div class="empty-state">No files received yet.<br>Scan the QR code and drop some files!</div>';
                return;
            }

            // For real reactivity we could use a framework, but Vanilla is fine here
            let html = '';
            files.forEach(file => {
                const icon = getFileIcon(file.name);
                const date = new Date(file.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                html += `
                    <a href="${file.url}" target="_blank" download="${file.name}" class="file-card">
                        <div class="file-icon">${icon}</div>
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-meta">
                            <span>${formatBytes(file.size)}</span>
                            <span>${date}</span>
                        </div>
                    </a>
                `;
            });
            grid.innerHTML = html;
        })
        .catch(err => console.error("Error fetching files:", err));
}

// Initialize
fetchConfig();
fetchFiles();

// Poll for new files every 3 seconds
setInterval(fetchFiles, 3000);
setInterval(fetchConfig, 3000); // Poll config in case tunnel connects late

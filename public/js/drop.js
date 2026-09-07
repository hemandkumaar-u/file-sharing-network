const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const percentText = document.getElementById('percentText');
const statusMessage = document.getElementById('statusMessage');
const notification = document.getElementById('notification');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle selected files (via click)
fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length === 0) return;
    uploadFiles(files);
}

function showNotification(msg, type) {
    notification.textContent = msg;
    notification.className = 'notification ' + type;
    
    // Auto hide after 4 seconds if success
    if (type === 'success') {
        setTimeout(() => {
            notification.className = 'notification';
        }, 4000);
    }
}

function uploadFiles(files) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    notification.className = 'notification';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    percentText.textContent = '0%';
    statusMessage.textContent = `Uploading ${files.length} file(s)...`;

    const xhr = new XMLHttpRequest();
    
    // Progress event
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percentComplete + '%';
            percentText.textContent = percentComplete + '%';
        }
    });

    // Complete event
    xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                showNotification(response.message || 'Upload complete!', 'success');
            } catch(e) {
                showNotification('Upload complete!', 'success');
            }
        } else {
            showNotification('Upload failed. Server responded with ' + xhr.status, 'error');
        }
        setTimeout(() => {
            progressContainer.style.display = 'none';
            fileInput.value = ''; // Reset input
        }, 1000);
    });

    // Error event
    xhr.addEventListener('error', () => {
        showNotification('Network error occurred during upload.', 'error');
        progressContainer.style.display = 'none';
    });
    
    // Upload endpoint is /api/upload
    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
}

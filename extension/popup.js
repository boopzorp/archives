document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('app-iframe');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const statusContainer = document.getElementById('status-container');
    const appUrl = 'https://arch1ves.vercel.app/extension-popup';

    iframe.src = appUrl;

    const connectionTimeout = setTimeout(() => {
        // If the iframe hasn't loaded after 5 seconds, show an error
        if (iframe.style.display === 'none') {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'block';
        }
    }, 5000); // 5 second timeout

    iframe.onload = () => {
        clearTimeout(connectionTimeout);
        if (statusContainer) statusContainer.style.display = 'none';
        iframe.style.display = 'block';
    };
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
        // IMPORTANT: Always verify the origin of the message
        if (event.origin !== new URL(appUrl).origin) {
            return;
        }

        if (event.data.type === 'SAVE_PAGE') {
            chrome.runtime.sendMessage({ type: 'SAVE_PAGE' });
            window.close(); // Close the popup
        } else if (event.data.type === 'OPEN_APP') {
            chrome.runtime.sendMessage({ type: 'OPEN_APP' });
            window.close();
        } else if (event.data.type === 'AUTH_ACTION') {
            chrome.runtime.sendMessage({ type: 'AUTH_ACTION', path: event.data.path });
            window.close();
        }
    });
});

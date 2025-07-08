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
        
        // Get the current tab and send its URL to the iframe
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            // Only send http/https URLs
            if (currentTab && currentTab.url && currentTab.url.startsWith('http')) {
                iframe.contentWindow.postMessage({ type: 'CURRENT_TAB_INFO', url: currentTab.url }, new URL(appUrl).origin);
            }
        });
    };
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
        // IMPORTANT: Always verify the origin of the message
        if (event.origin !== new URL(appUrl).origin) {
            return;
        }

        if (event.data.type === 'CLOSE_POPUP') {
            window.close();
        } else if (event.data.type === 'OPEN_APP') {
            chrome.runtime.sendMessage({ type: 'OPEN_APP' });
            window.close();
        } else if (event.data.type === 'AUTH_ACTION') {
            chrome.runtime.sendMessage({ type: 'AUTH_ACTION', path: event.data.path });
            window.close();
        }
    });
});

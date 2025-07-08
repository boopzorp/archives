
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('app-iframe');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const statusContainer = document.getElementById('status-container');
    const appUrl = 'https://arch1ves.vercel.app/extension-popup';
    const appOrigin = new URL(appUrl).origin;

    iframe.src = appUrl;

    const connectionTimeout = setTimeout(() => {
        if (iframe.style.display === 'none') {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'block';
        }
    }, 5000);

    iframe.onload = () => {
        clearTimeout(connectionTimeout);
        if (statusContainer) statusContainer.style.display = 'none';
        iframe.style.display = 'block';
    };
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
        // IMPORTANT: Always verify the origin of the message
        if (event.origin !== appOrigin) {
            return;
        }

        const { type, path } = event.data;

        switch (type) {
            case 'POPUP_UI_READY':
                // The iframe is ready, now get the tab info and send it
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    const currentTab = tabs[0];
                    if (currentTab && currentTab.url && currentTab.url.startsWith('http')) {
                        iframe.contentWindow.postMessage({ type: 'CURRENT_TAB_INFO', url: currentTab.url }, appOrigin);
                    }
                });
                break;
            case 'CLOSE_POPUP':
                window.close();
                break;
            case 'OPEN_APP':
                chrome.runtime.sendMessage({ type: 'OPEN_APP' });
                window.close();
                break;
            case 'AUTH_ACTION':
                chrome.runtime.sendMessage({ type: 'AUTH_ACTION', path: path });
                window.close();
                break;
        }
    });
});

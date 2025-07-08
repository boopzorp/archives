
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('app-iframe');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const statusContainer = document.getElementById('status-container');
    const appUrl = 'https://arch1ves.vercel.app/extension-popup';
    const appOrigin = new URL(appUrl).origin;

    // Get the current tab's URL and pass it to the iframe as a query parameter
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        let urlToLoad = appUrl;
        if (currentTab && currentTab.url && currentTab.url.startsWith('http')) {
            // Add the URL as a query parameter
            urlToLoad += `?url=${encodeURIComponent(currentTab.url)}`;
        }
        iframe.src = urlToLoad;
    });

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
            console.warn('Message from unexpected origin ignored:', event.origin);
            return;
        }

        const { type, path } = event.data;

        switch (type) {
            case 'CLOSE_POPUP':
                window.close();
                break;
            case 'OPEN_APP':
                chrome.runtime.sendMessage({ type: 'OPEN_APP' });
                window.close();
                break;
            case 'AUTH_ACTION':
                // Add from=extension to tell the auth pages not to redirect to the dashboard
                const authPath = `${path}${path.includes('?') ? '&' : '?'}from=extension`;
                chrome.runtime.sendMessage({ type: 'AUTH_ACTION', path: authPath });
                window.close();
                break;
        }
    });
});

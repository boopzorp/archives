
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('app-iframe');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const statusContainer = document.getElementById('status-container');
    const appUrl = 'https://arch1ves.vercel.app/extension-popup';
    const appOrigin = new URL(appUrl).origin;

    // Set up message listener to catch all messages from the iframe
    window.addEventListener('message', (event) => {
        // IMPORTANT: Always verify the origin of the message
        if (event.origin !== appOrigin) {
            return;
        }

        const { type, path } = event.data;

        switch (type) {
            case 'CLOSE_POPUP':
                window.close();
                break;
            case 'OPEN_APP':
                chrome.tabs.create({ url: `${appOrigin}/dashboard` });
                window.close();
                break;
            case 'AUTH_ACTION':
                const authUrl = `${appOrigin}${path}?from=extension`;
                chrome.tabs.create({ url: authUrl });
                window.close();
                break;
        }
    });

    iframe.src = appUrl;

    const connectionTimeout = setTimeout(() => {
        if (iframe.style.display === 'none') {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'block';
        }
    }, 5000);

    // When the iframe has finished loading, we initiate the data transfer
    iframe.onload = () => {
        clearTimeout(connectionTimeout);
        if (statusContainer) statusContainer.style.display = 'none';
        iframe.style.display = 'block';

        // Now that the iframe is ready, get the tab info and send it
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url && currentTab.url.startsWith('http')) {
                iframe.contentWindow.postMessage({ type: 'CURRENT_TAB_INFO', url: currentTab.url }, appOrigin);
            } else {
                // If there's no valid URL, send null so the UI can disable the save button
                iframe.contentWindow.postMessage({ type: 'CURRENT_TAB_INFO', url: null }, appOrigin);
            }
        });
    };
});

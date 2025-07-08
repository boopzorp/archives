
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
            case 'POPUP_READY':
                // The iframe is ready to receive messages, now query for the tab info and send it
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error querying tabs:", chrome.runtime.lastError.message);
                        if (currentUrl === null) {
                            console.log("No active tab with a valid URL found.");
                        }
                        // Send the current tab info to the iframe
                        iframe.contentWindow.postMessage({ type: 'CURRENT_TAB_INFO', url: currentUrl }, appOrigin);
                    });
                });
                break;
            case 'POPUP_SCRIPT_READY_ACK':
                // Iframe received the POPUP_SCRIPT_READY message, now send the tab info
                break; // No action needed in popup script upon ACK
        }
    });

    // Send a message to the iframe to indicate the popup script is ready
    iframe.onload = () => {
        iframe.contentWindow.postMessage({ type: 'POPUP_SCRIPT_READY' }, appOrigin);
    };

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
    };
});

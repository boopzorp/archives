
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('app-iframe');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const statusContainer = document.getElementById('status-container');
    const baseUrl = 'https://arch1ves.vercel.app/extension-popup';
    const appOrigin = new URL(baseUrl).origin;

    // First, query for the active tab to get its URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error("Error querying tabs:", chrome.runtime.lastError.message);
            // Handle error, maybe show an error message in the popup
            return;
        }
        
        const currentTab = tabs[0];
        const currentUrl = (currentTab && currentTab.url && currentTab.url.startsWith('http')) 
            ? currentTab.url 
            : null;

        // Construct the final URL with the current page's URL as a query parameter
        const finalUrl = currentUrl 
            ? `${baseUrl}?url=${encodeURIComponent(currentUrl)}`
            : baseUrl;

        iframe.src = finalUrl;
    });
    
    // Set up a listener for simple commands from the iframe (e.g., to close popup or open a tab)
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

    // Handle iframe loading and connection timeout
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
});

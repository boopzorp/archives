document.addEventListener('DOMContentLoaded', function() {
  const iframe = document.getElementById('app-frame');
  const loader = document.getElementById('loader');
  const errorDisplay = document.getElementById('error');
  
  // NOTE: For production, change this to your app's domain.
  const appUrl = 'http://localhost:9002'; 
  
  iframe.src = `${appUrl}/extension-popup`;

  iframe.addEventListener('load', () => {
    loader.style.display = 'none';
    errorDisplay.style.display = 'none';
    iframe.style.display = 'block';
  });

  // A simple way to detect connection errors is to see if the iframe loads.
  // We'll set a timeout. If the 'load' event doesn't fire, we assume a connection error.
  const timeout = setTimeout(() => {
    // If the iframe is still not visible, it's very likely a connection error.
    if (iframe.style.display === 'none') {
        loader.style.display = 'none';
        errorDisplay.style.display = 'block';
    }
  }, 3000); // 3-second timeout

  // Listen for messages from the iframe
  window.addEventListener('message', (event) => {
    // IMPORTANT: Check the origin of the message for security
    if (event.origin !== appUrl) {
      return;
    }

    const { type, path } = event.data;

    if (type === 'SAVE_PAGE') {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url) {
          const urlToSave = tabs[0].url;
          
          if (urlToSave.startsWith('chrome://') || urlToSave.startsWith(appUrl)) {
              // Can't save internal chrome pages or the app itself.
              // The button in the iframe will likely handle user feedback.
              console.log("Cannot save this page.");
              return;
          }

          const newTabUrl = `${appUrl}/dashboard?add=${encodeURIComponent(urlToSave)}`;
          chrome.tabs.create({ url: newTabUrl });
          
          // Close the popup after initiating the save.
          setTimeout(() => window.close(), 100);
        }
      });
    } else if (type === 'AUTH_ACTION') {
        const authUrl = `${appUrl}${path}`;
        chrome.tabs.create({ url: authUrl });
        setTimeout(() => window.close(), 100);
    } else if (type === 'OPEN_APP') {
        const dashboardUrl = `${appUrl}/dashboard`;
        chrome.tabs.create({ url: dashboardUrl });
        setTimeout(() => window.close(), 100);
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-btn');
  const statusElement = document.getElementById('status');
  
  // NOTE: For production, change this to your app's domain.
  const appUrl = 'http://localhost:9002'; 

  saveButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        const urlToSave = tabs[0].url;
        
        // Prevent saving chrome internal pages or the app itself
        if (urlToSave.startsWith('chrome://') || urlToSave.startsWith(appUrl)) {
            statusElement.textContent = "Cannot save this page.";
            return;
        }

        const newTabUrl = `${appUrl}/dashboard?add=${encodeURIComponent(urlToSave)}`;
        chrome.tabs.create({ url: newTabUrl });
        
        statusElement.textContent = "Opening archives...";
        setTimeout(() => window.close(), 500); // Close popup after opening tab

      } else {
        statusElement.textContent = "Could not get current tab URL.";
      }
    });
  });
});

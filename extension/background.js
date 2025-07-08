chrome.action.onClicked.addListener((tab) => {
  // This event is fired when the user clicks the extension icon.
  // The logic is handled in the popup, which is opened by default.
});

// This listener handles messages from the popup, specifically to open the main app dashboard.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const appUrl = 'https://arch1ves.vercel.app';
  if (request.type === 'OPEN_APP') {
    chrome.tabs.create({ url: `${appUrl}/dashboard` });
  }
});

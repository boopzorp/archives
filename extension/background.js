chrome.action.onClicked.addListener((tab) => {
  // This event is fired when the user clicks the extension icon.
  // We will handle the logic in the popup.
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const appUrl = 'https://arch1ves.vercel.app';
  if (request.type === 'SAVE_PAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const encodedUrl = encodeURIComponent(currentTab.url);
        // Make sure your web app's dashboard can handle this query parameter
        chrome.tabs.create({ url: `${appUrl}/dashboard?add=${encodedUrl}` });
      }
    });
  } else if (request.type === 'OPEN_APP') {
    chrome.tabs.create({ url: `${appUrl}/dashboard` });
  } else if (request.type === 'AUTH_ACTION') {
    chrome.tabs.create({ url: `${appUrl}${request.path}` });
  }
});

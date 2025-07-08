chrome.action.onClicked.addListener((tab) => {
  // This event is fired when the user clicks the extension icon.
  // We will handle the logic in the popup.
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const appUrl = 'https://arch1ves.vercel.app';
  if (request.type === 'OPEN_APP') {
    chrome.tabs.create({ url: `${appUrl}/dashboard` });
  } else if (request.type === 'AUTH_ACTION') {
    chrome.tabs.create({ url: `${appUrl}${request.path}` });
  }
});

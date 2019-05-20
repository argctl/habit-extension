// const DEFAULT_URLS = ['facebook.com', 'youtube.com', 'reddit.com']
function getTimestamp (date = new Date()) {
  return new Date(date).getTime() / 1000 | 0
}
function listener () {
  console.log('triggered')
  chrome.storage.sync.get(['excuses', 'debounce', 'urls', 'backupNum'], function (result) {
    const prevExcuses = result.excuses ? result.excuses : [] // TODO - move to storage.onChanged
    const backupNum = result.backupNum ? result.backupNum : 0
    const { debounce, urls } = result
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      const { url } = tabs[0]
      const isCorrectUrl = urls.findIndex(u => url.indexOf(u) !== -1) !== -1
      console.log({ isCorrectUrl })
      const debounceUrl = Object.keys(debounce).indexOf(url) !== -1 ? debounce[url] : null
      if ((!debounceUrl || getTimestamp(debounceUrl) + 10 < getTimestamp()) && isCorrectUrl) {
        const choice = window.prompt(`Why did you decide to go to ${url}?`)
        const date = new Date().toString()
        const excuses = [ ...prevExcuses, { date, choice, url } ]
        chrome.storage.sync.set({ excuses, debounce: { ...debounce, [url]: new Date().toString() } }, function () {
          if (chrome.extension.lastError) {
            const error = chrome.extension.lastError.message
            console.log({ error })
            if (error === 'QUOTA_BYTES_PER_ITEM quota exceeded') {
              const num = backupNum + 1
              const key = `backup${num}`
              chrome.storage.sync.set({ excuses: [{ date, choice, url }], [key]: prevExcuses, backupNum: num })
            }
          }
        })
      }
    })
  })
}

function setupUrlListener () {
  chrome.storage.sync.get('urls', function (urlObj) {
    const { urls } = urlObj
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
      urls.forEach(url => {
        chrome.declarativeContent.onPageChanged.addRules([{
          conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: url }
          })
          ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
        }])
      })
      chrome.webNavigation.onDOMContentLoaded.removeListener(listener)
      chrome.webNavigation.onDOMContentLoaded.addListener(listener, { url: urls.map(urlContains => ({ urlContains })) })
    })
  })
}

chrome.runtime.onInstalled.addListener(function () {
  console.log('the chrome extension is installing')
  chrome.runtime.getPackageDirectoryEntry(function (root) {
    root.getFile('dat/defaultUrls.json', {}, function (fileEntry) {
      fileEntry.file(function (file) {
        var reader = new FileReader()
        reader.onloadend = function (e) {
          const DEFAULT_URLS = JSON.parse(this.result)
          chrome.storage.sync.get('urls', function (result) {
            const { urls } = result
            if (!urls || urls.length === 0) chrome.storage.sync.set({ urls: DEFAULT_URLS })
            setupUrlListener()
          })
        }
        reader.readAsText(file)
      })
    })
  })
})
chrome.runtime.onStartup.addListener(function () {
  console.log('the chrome extension is starting up')
  setupUrlListener()
})

chrome.storage.onChanged.addListener(function (changes, namespace) {
  const isUrls = Object.keys(changes).indexOf('urls') !== -1
  if (isUrls) {
    setupUrlListener()
  } else {
    console.log({ changes })
  }
})

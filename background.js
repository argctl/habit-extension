// const DEFAULT_URLS = ['facebook.com', 'youtube.com', 'reddit.com']
import { test } from './test.js'
function getTimestamp (date = new Date()) {
  return new Date(date).getTime() / 1000 | 0
}
function listener () {
  chrome.storage.sync.get(['excuses', 'debounce'], function (result) {
    const prevExcuses = result.excuses ? result.excuses : [] // TODO - move to storage.onChanged
    const { debounce } = result
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      const { url } = tabs[0]
      const debounceUrl = Object.keys(debounce).indexOf(url) !== -1 ? debounce[url] : null
      if (!debounceUrl || getTimestamp(debounceUrl) + 10 < getTimestamp()) {
        const choice = window.prompt('Why did you decide to go to this site?', '')
        const date = new Date().toString()
        const excuses = [ ...prevExcuses, { date, choice, url } ]
        chrome.storage.sync.set({ excuses, debounce: { ...debounce, [url]: new Date().toString() } })
      }
    })
  })
}

function setupUrlListener () {
  chrome.runtime.getPackageDirectoryEntry(function (root) {
    root.getFile('dat/defaultUrls.json', {}, function (fileEntry) {
      fileEntry.file(function (file) {
        var reader = new FileReader()
        reader.onloadend = function (e) {
          const DEFAULT_URLS = JSON.parse(this.result)
          chrome.storage.sync.get('urls', function (urlObj) {
            const urls = urlObj.urls && urlObj.urls.length !== 0 ? urlObj.urls : DEFAULT_URLS
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
        reader.readAsText(file)
      })
    })
  })
}

chrome.runtime.onInstalled.addListener(function () {
  test()
  chrome.storage.sync.set({ color: '#3aa757' }, function () {
  })
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

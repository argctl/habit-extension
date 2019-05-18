// const DEFAULT_URLS = ['facebook.com', 'facebook.com', 'youtube.com', 'youtube.com', 'reddit.com']
// const DEFAULT_URLS =
function downloadExcuses (pretty = true) {
  chrome.storage.sync.get('excuses', function (result) {
    const { excuses } = result
    const data = `data:text/json;charset=utf-8,${encodeURIComponent(pretty ? JSON.stringify(excuses, null, 2) : JSON.stringify(excuses))}`
    const downloaderEle = document.createElement('a')
    downloaderEle.setAttribute('href', data)
    downloaderEle.setAttribute('download', 'excuses.json')
    document.body.appendChild(downloaderEle)
    downloaderEle.click()
    downloaderEle.remove()
  })
}

function nameAsString (obj) {
  return Object.keys(obj)[0]
}

function createLi (url, urls) {
  const urlLi = document.createElement('li')
  urlLi.innerHTML = `<div id=${url}> <button id="removeBtn" name=${url}>remove</button> ${url}</div>`
  urlLi.addEventListener('click', e => {
    const { name } = e.target
    const filteredURLs = urls.filter(url => url !== name)
    const ele = document.getElementById(name)
    console.log({ ele })
    ele.parentNode.removeChild(ele)
    chrome.storage.sync.set({ urls: filteredURLs })
  })
  return urlLi
}

const page = document.getElementById('optionsDiv')
function createOptions () {
  const resetBtn = document.createElement('button')
  resetBtn.addEventListener('click', function () {
    chrome.storage.sync.set({ excuses: [], urls: [], debounce: {} }, function () {
      document.getElementById('msg').innerHTML = 'you have reset all data!'
      chrome.runtime.reload()
    })
  })
  const eraseHistory = document.createElement('button')
  eraseHistory.addEventListener('click', () => {
    downloadExcuses()
    chrome.storage.sync.set({ excuses: [] }, function () {
      console.log('excuses downloaded and reset')
    })
  })
  const addForm = document.createElement('form')
  const urlInput = document.createElement('input')
  const addBtn = document.createElement('button')
  addForm.addEventListener('submit', e => {
    e.preventDefault()
  })
  addForm.id = nameAsString({ addForm })
  urlInput.id = 'urlInput'
  addBtn.id = nameAsString({ addBtn })
  resetBtn.innerText = 'reset'
  eraseHistory.innerText = 'Download and Erase History'
  addBtn.innerText = 'add url'
  addBtn.addEventListener('click', () => {
    const regex = /[-a-zA-Z0-9@:%._+~#=]{2,256}.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/
    const url = document.getElementById('urlInput')
    const { value } = url
    const isUrl = regex.test(value)
    if (isUrl) {
      // add url to list
      chrome.storage.sync.get('urls', function (result) {
        const { urls } = result
        const urlsUpdated = [...urls, value]
        const ul = document.getElementById('ul')
        const urlLi = createLi(value, urls)
        ul.appendChild(urlLi)
        chrome.storage.sync.set({ urls: urlsUpdated })
      })
    } else {
      document.getElementById('msg').innerHTML = `<div class="error">invalid url</div>`
    }
  })
  addForm.appendChild(urlInput)
  addForm.appendChild(addBtn)
  page.appendChild(addForm)
  page.appendChild(eraseHistory)
  chrome.storage.sync.get('urls', function (result) {
    // const urls = result.urls && result.urls.length > 0 ? result.urls : DEFAULT_URLS
    const { urls } = result
    const ul = document.createElement('ul')
    ul.id = nameAsString({ ul })
    urls.forEach(url => {
      const urlLi = createLi(url, urls)
      ul.appendChild(urlLi)
    })
    page.appendChild(ul)
  })
  page.appendChild(resetBtn)
  document.getElementById('downloader').addEventListener('click', () => {
    downloadExcuses()
  })
}

createOptions()

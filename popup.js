const changeColor = document.getElementById('changeColor')

// chrome.storage.sync.get('color', function (data) {
//   changeColor.style.backgroundColor = data.changeColor
//   changeColor.setAttribute('value', data.color)
// })

// changeColor.onclick = function (element) {
//   const color = element.target.value
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.tabs.executeScript(
//       tabs[0].id,
//       { code: 'document.body.style.backgroundColor = "' + color + '";' }
//     )
//   })
// }
changeColor.onclick = function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.remove(tabs[0].id, function () {
      console.log('tab removed')
    })
  })
}

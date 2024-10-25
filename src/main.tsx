
import {
  createVimComponent,
  getLocalSettings,
  THREE
} from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
// Edge server doesn't serve http ranges properly
const url = params.has('vim')
  ? params.get('vim')
  : null

demo()
async function demo () {
  const cmp = await createVimComponent(undefined, getLocalSettings())

  const request = await cmp.loader.request(
    {
      url: 'https://saas-api-dev.vimaec.com/api/public/8A12977A-E69B-42DC-D05B-08DCE88D23C7/2024.10.11',
      headers: {
        Authorization: 'yJSkyCvwpksvnajChA64ofKQS2KnB24ADHENUYKYTZFZc4SzcWa5WPwJNzTvrsZ8sv8SL8R69c92TUThFkLi1YsvpGxnZFExWs5mbQisuWyhBPAXosSEUhPXyUaXHHBJ'
      }
    },
    {
      progressive: true,
      rotation: new THREE.Vector3(270, 0, 0)
    }
  )

  for await (const progress of request.getProgress()) {
    console.log(`Downloading Vim (${(progress.loaded / 1000).toFixed(0)} kb)`)
  }

  const result = await request.getResult()
  if (result.isError()) {
    console.error('Error loading vim', result.error)
    return
  }

  cmp.loader.add(result.result)

  globalThis.THREE = THREE
  globalThis.component = cmp
  globalThis.vim = result.result
}

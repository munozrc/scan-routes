// @ts-check
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const launchOptions = {
  headless: true
}

const URL = 'http://69.164.223.208:8086/#/' // http://69.164.223.208:8086/#/
const unwantedCodes = [400, 403, 404, 500, 502, 504]

;(async () => {
  const browser = await chromium.launch(launchOptions)
  const routes = readFileWithRoutes()

  let index = 0

  for (const route of routes) {
    const { pathname } = route

    console.log(` [+] ${URL + pathname} ✔`)

    const page = await browser.newPage()
    const response = await page.goto(URL + pathname)

    const status = response?.status() || 500
    const notFoundInside = await page.locator('h1').allInnerTexts()

    if (!unwantedCodes.includes(status) && !notFoundInside.includes('Not Found')) {
      page.waitForTimeout(200)
      const parseFilename = pathname.replace(/\//g, '')
      await page.screenshot({ path: `screenshots/${parseFilename}.png` })
    }

    await page.close()

    routes[index].status = status
    routes[index].pathname = URL + pathname
    index++
  }

  await browser.close()

  const filename = join(process.cwd(), `scan-${Date.now()}.json`)
  writeFileSync(filename, JSON.stringify(routes), 'utf8')

  console.log('\nResultados guardados 🙌👍')
})()

function readFileWithRoutes () {
  try {
    const path = join(process.cwd(), 'routes.txt')
    const routes = readFileSync(path, 'utf8')
    const normalizeRoutes = routes.replace(/\r/g, '').split('\n')
    return parserObjectRoute(normalizeRoutes)
  } catch (error) {
    console.log('Error: Archivos con rutas no encontrado')
    return process.exit(1)
  }
}

/**
 * @param {Array<string>} routes
 */
function parserObjectRoute (routes) {
  return routes.map(route => ({
    pathname: route,
    status: 0
  }))
}

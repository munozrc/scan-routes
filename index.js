// @ts-check
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const launchOptions = {
  headless: false
}

const URL = 'https://books.toscrape.com'
const unwantedCodes = [500, 404]

;(async () => {
  const browser = await chromium.launch(launchOptions)
  const routes = readFileWithRoutes()

  let index = 0

  for (const route of routes) {
    const { pathname } = route

    const page = await browser.newPage()
    const response = await page.goto(URL + pathname)

    const status = response?.status() || 500

    if (!unwantedCodes.includes(status)) {
      const parseFilename = pathname.replace(/\//g, '')
      await page.screenshot({ path: `screenshots/${parseFilename}.png` })
    }

    await page.close()

    routes[index].status = status
    index++
  }

  await browser.close()
  console.log({ routes })
})()

function readFileWithRoutes () {
  try {
    const path = join(process.cwd(), 'routes.txt')
    const routes = readFileSync(path, 'utf8')
    const normalizeRoutes = routes.replace('\r', '').split('\n')
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

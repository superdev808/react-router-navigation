const path = require('path')
const { setup } = require('jest-environment-puppeteer')

module.exports = async function globalSetup() {
  const configPath = path.resolve(__dirname, './jest-puppeteer.config.js')
  process.env.JEST_PUPPETEER_CONFIG = configPath
  await setup()
}

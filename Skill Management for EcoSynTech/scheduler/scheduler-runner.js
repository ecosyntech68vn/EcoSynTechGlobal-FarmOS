// Robust scheduler runner for EcoSynTech skills
// Reads config/scheduler.json (or SCHEDULER_CONFIG env) and triggers HTTP endpoints
const fs = require('fs')
const path = require('path')
const http = require('http')

function msFromInterval(interval) {
  if (!interval) return 0
  let m = /^([0-9]+)m$/.exec(interval)
  if (m) return parseInt(m[1], 10) * 60_000
  let h = /^([0-9]+)h$/.exec(interval)
  if (h) return parseInt(h[1], 10) * 3_600_000
  return 0
}

function executeSkill(skill) {
  const payload = JSON.stringify({ skill })
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/skills/execute',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }
  const req = http.request(options, (res) => {
    res.on('data', () => {})
  })
  req.on('error', (err) => {
    console.error('Scheduler error executing', skill, err.message)
  })
  req.write(payload)
  req.end()
}

function loadConfig() {
  const cfgPath = process.env.SCHEDULER_CONFIG || path.resolve(__dirname, '../config/scheduler.json')
  if (!fs.existsSync(cfgPath)) return null
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Invalid scheduler.json', e)
    return null
  }
}

let timers = []
function clearTimers() {
  timers.forEach((t) => clearInterval(t))
  timers = []
}

function scheduleFromCfg(cfg) {
  if (!cfg || !cfg.schedules) return
  cfg.schedules.forEach((s) => {
    if (!s.enabled) return
    const intervalMs = msFromInterval(s.interval)
    if (!intervalMs) return
    const t = setInterval(() => {
      if (!s.enabled) return
      ;(s.skills || []).forEach(executeSkill)
    }, intervalMs)
    timers.push(t)
  })
}

let initialized = false
function startScheduler() {
  const cfg = loadConfig()
  if (!cfg) {
    console.error('Scheduler config not found')
    return
  }
  scheduleFromCfg(cfg)
  // Simple file watcher to reload config on change
  const cfgPath = process.env.SCHEDULER_CONFIG || path.resolve(__dirname, '../config/scheduler.json')
  fs.watch(cfgPath, (event) => {
    if (event === 'change') {
      try {
        clearTimers()
        const newCfg = loadConfig()
        scheduleFromCfg(newCfg)
        console.log('Scheduler config reloaded')
      } catch (e) {
        console.error('Failed to reload scheduler config', e)
      }
    }
  })
  initialized = true
  console.log('Scheduler started')
}

if (!initialized) startScheduler()

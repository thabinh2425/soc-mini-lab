// Real HTTP verification against an isolated SQLite database.
import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'
import net from 'node:net'

const root = resolve(import.meta.dirname, '..')
const temp = await mkdtemp(join(tmpdir(), 'soc-smoke-'))
const freePort = () => new Promise(resolve => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port
    server.close(() => resolve(port))
  })
})
const apiPort = await freePort()
const webPort = await freePort()
const processes = []
function start(command, args, options) {
  const child = spawn(command, args, { windowsHide: true, stdio: 'inherit', ...options })
  processes.push(child)
  return child
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
  const exited = new Promise(resolve => child.once('exit', resolve))
  child.kill()
  await exited
}
async function ready(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('Server failed to start: ' + url)
}
try {
  const backendOptions = {
    cwd: join(root, 'backend'),
    env: { ...process.env, SOC_SERVE_FRONTEND: '1', SOC_DATABASE_URL: 'sqlite:///' + join(temp, 'smoke.db').replaceAll('\\', '/') },
  }
  const backendArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(apiPort)]
  const backend = start(join(root, 'backend/.venv/Scripts/python.exe'), backendArgs, backendOptions)
  await ready('http://127.0.0.1:' + apiPort + '/api/health')
  const productionBase = 'http://127.0.0.1:' + apiPort
  const productionHtml = await (await fetch(productionBase)).text()
  assert.match(productionHtml, /SOC Mini Lab/)
  const asset = productionHtml.match(/src="([^"]+\.js)"/)?.[1]
  assert.ok(asset)
  assert.equal((await fetch(productionBase + asset)).status, 200)
  assert.equal((await fetch(productionBase + '/api/not-found')).status, 404)
  start(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(webPort), '--strictPort'], {
    cwd: root, env: { ...process.env, SOC_API_TARGET: 'http://127.0.0.1:' + apiPort },
  })
  const base = 'http://127.0.0.1:' + webPort
  await ready(base)
  assert.match(await (await fetch(base)).text(), /SOC Mini Lab/)
  const data = await (await fetch(base + '/api/bootstrap')).json()
  assert.equal(data.alerts.length, 5)
  const saved = await fetch(base + '/api/cases/ssh-brute-force/notes', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'HTTP smoke check' }),
  })
  assert.equal(saved.status, 200)
  const progress = await (await fetch(base + '/api/progress')).json()
  assert.equal(progress.notes['ssh-brute-force'], 'HTTP smoke check')
  const post = async path => {
    const response = await fetch(base + path, { method: 'POST' })
    assert.equal(response.status, 200)
    return response.json()
  }
  assert.equal((await post('/api/detection/demo/benign')).inserted, 9)
  assert.equal((await post('/api/detection/run')).created, 0)
  assert.equal((await post('/api/detection/demo/attack')).inserted, 13)
  const run = await post('/api/detection/run')
  assert.equal(run.created, 3)
  assert.equal((await post('/api/detection/run')).created, 0)
  const evidence = await (await fetch(base + '/api/alerts/' + run.alertIds[0] + '/evidence')).json()
  assert.ok(evidence.logs.length > 0)
  assert.equal(evidence.alert.origin, 'detection')
  const trainingRequest = async (path, method = 'GET', body) => {
    const response = await fetch(base + '/api/training' + path, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    assert.equal(response.status, 200)
    return response.json()
  }
  const training = await trainingRequest('/cases/ssh-brute-force/sessions', 'POST')
  const draft = await trainingRequest('/sessions/' + training.id, 'PUT', {
    revision: 0, answers: { 'ssh-q1': '203.0.113.42' }, evidenceIds: ['LOG-8101'], conclusion: 'Đang kiểm tra',
  })
  assert.equal((await trainingRequest('/sessions/' + training.id)).answers['ssh-q1'], '203.0.113.42')
  const complete = await trainingRequest('/sessions/' + training.id, 'PUT', {
    revision: draft.revision,
    answers: { 'ssh-q1': '203.0.113.42', 'ssh-q2': 'A privileged login succeeded', 'ssh-q3': 'Block the source and rotate credentials' },
    evidenceIds: ['LOG-8101', 'LOG-8103'], conclusion: 'Đã xác nhận đăng nhập root sau chuỗi thất bại.',
  })
  const graded = await trainingRequest('/sessions/' + training.id + '/submit', 'POST', { revision: complete.revision })
  assert.equal(graded.status, 'completed')
  assert.equal(graded.result.score, 95) // 60 quiz + 25 evidence + 5 note + 5 conclusion, no analyst timeline.
  assert.equal((await trainingRequest('/sessions')).length, 1)
  assert.equal((await (await fetch(base + '/api/progress')).json()).missionResults['ssh-brute-force'].score, 95)
  const exportJson = await fetch(base + '/api/reports/export?format=json')
  assert.equal(exportJson.status, 200)
  assert.match(exportJson.headers.get('content-disposition'), /attachment/)
  assert.equal((await exportJson.json()).summary.completedMissions, 1)
  const exportCsv = await fetch(base + '/api/reports/export?format=csv')
  assert.equal(exportCsv.status, 200)
  assert.match(await exportCsv.text(), /SYNTHETIC DEMO DATA/)
  await stop(backend)
  start(join(root, 'backend/.venv/Scripts/python.exe'), backendArgs, backendOptions)
  await ready(productionBase + '/api/health')
  const restored = await (await fetch(productionBase + '/api/progress')).json()
  assert.equal(restored.missionResults['ssh-brute-force'].score, 95)
  assert.equal(restored.notes['ssh-brute-force'], 'HTTP smoke check')
  assert.equal((await (await fetch(productionBase + '/api/reports/export')).json()).alerts.length, 8)
  console.log('PASS: single-server production/assets, Vite proxy, detection, training, exports and persistence across process restart.')
} finally {
  for (const child of processes.reverse()) {
    await stop(child)
  }
}

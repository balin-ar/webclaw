import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

type DetectedService = {
  name: string
  pid: number
  port: number
  protocol: string
  address: string
  url: string
  status: 'up'
}

function detectListeningPorts(): DetectedService[] {
  const services: DetectedService[] = []
  
  try {
    // Try ss first (modern), fallback to netstat
    let output: string
    try {
      output = execSync('ss -tlnp 2>/dev/null', { encoding: 'utf-8', timeout: 5000 })
    } catch {
      try {
        output = execSync('netstat -tlnp 2>/dev/null', { encoding: 'utf-8', timeout: 5000 })
      } catch {
        return services
      }
    }

    const lines = output.split('\n').filter((l) => l.includes('LISTEN'))

    for (const line of lines) {
      try {
        // Parse address:port
        const addrMatch = line.match(/(\S+):(\d+)\s/)
        if (!addrMatch) continue

        const address = addrMatch[1]
        const port = parseInt(addrMatch[2], 10)
        if (isNaN(port) || port === 0) continue

        // Parse process name/pid
        let processName = 'unknown'
        let pid = 0

        // ss format: users:(("node",pid=12345,fd=3))
        const ssMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/)
        if (ssMatch) {
          processName = ssMatch[1]
          pid = parseInt(ssMatch[2], 10)
        } else {
          // netstat format: 12345/node
          const netstatMatch = line.match(/(\d+)\/(\S+)/)
          if (netstatMatch) {
            pid = parseInt(netstatMatch[1], 10)
            processName = netstatMatch[2]
          }
        }

        // Try to get full command line for better naming
        let fullCmd = processName
        if (pid > 0) {
          try {
            fullCmd = readFileSync(`/proc/${pid}/cmdline`, 'utf-8')
              .replace(/\0/g, ' ')
              .trim()
          } catch {
            // ignore
          }
        }

        // Generate friendly name
        const friendlyName = getFriendlyName(processName, fullCmd, port)

        const host = address === '*' || address === '0.0.0.0' || address === '::' ? 'localhost' : address
        const url = `http://${host}:${port}`

        services.push({
          name: friendlyName,
          pid,
          port,
          protocol: 'tcp',
          address: `${address}:${port}`,
          url,
          status: 'up',
        })
      } catch {
        continue
      }
    }
  } catch {
    // ignore
  }

  // Sort by port
  return services.sort((a, b) => a.port - b.port)
}

function getFriendlyName(process: string, cmdline: string, port: number): string {
  const cmd = cmdline.toLowerCase()
  
  // Known services by port
  const knownPorts: Record<number, string> = {
    80: 'HTTP Server',
    443: 'HTTPS Server',
    3000: 'WebClaw (Production)',
    3001: 'WebClaw (Dev)',
    5000: 'Flask App',
    8000: 'Django',
    8080: 'File Browser',
    8123: 'Home Assistant',
    8443: 'HTTPS Alt',
    8899: 'Music Player',
    18789: 'OpenClaw Gateway',
  }

  if (knownPorts[port]) return knownPorts[port]

  // Detect by process/cmdline
  if (cmd.includes('vite')) return `Vite Dev Server (:${port})`
  if (cmd.includes('next')) return `Next.js (:${port})`
  if (cmd.includes('nginx')) return `Nginx (:${port})`
  if (cmd.includes('gunicorn')) return `Gunicorn (:${port})`
  if (cmd.includes('uvicorn')) return `Uvicorn (:${port})`
  if (cmd.includes('python')) return `Python (:${port})`
  if (cmd.includes('node')) return `Node.js (:${port})`
  if (cmd.includes('docker')) return `Docker (:${port})`
  if (cmd.includes('redis')) return `Redis (:${port})`
  if (cmd.includes('postgres')) return `PostgreSQL (:${port})`
  if (cmd.includes('mysql')) return `MySQL (:${port})`
  if (cmd.includes('mongo')) return `MongoDB (:${port})`

  return `${process} (:${port})`
}

export const Route = createFileRoute('/api/services')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const services = detectListeningPorts()
          return json({ services })
        } catch (err) {
          return json(
            { error: err instanceof Error ? err.message : String(err), services: [] },
            { status: 500 },
          )
        }
      },
    },
  },
})

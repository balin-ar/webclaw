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

  // Deduplicate: keep one entry per port (prefer IPv4 / 0.0.0.0 / *)
  const byPort = new Map<number, DetectedService>()
  for (const svc of services) {
    const existing = byPort.get(svc.port)
    if (!existing) {
      byPort.set(svc.port, svc)
    } else {
      // Prefer entry with PID, or IPv4 over IPv6
      if (svc.pid > 0 && existing.pid === 0) {
        byPort.set(svc.port, svc)
      } else if (!existing.address.includes('[') && svc.address.includes('[')) {
        // keep existing (IPv4)
      } else if (existing.address.includes('[') && !svc.address.includes('[')) {
        byPort.set(svc.port, svc)
      }
    }
  }

  // Filter out ephemeral/high ports that are likely internal (>30000 unless known)
  const knownHighPorts = new Set([40000])
  const filtered = [...byPort.values()].filter((svc) => {
    if (svc.port < 30000) return true
    if (knownHighPorts.has(svc.port)) return true
    if (svc.name !== `Port ${svc.port}`) return true // has a known name
    return false
  })

  // Sort by port
  return filtered.sort((a, b) => a.port - b.port)
}

function getFriendlyName(process: string, cmdline: string, port: number): string {
  const cmd = cmdline.toLowerCase()
  
  const knownPorts: Record<number, string> = {
    22: 'SSH',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP Server',
    443: 'HTTPS / Tailscale',
    631: 'CUPS (Printing)',
    1883: 'Mosquitto MQTT',
    3000: 'WebClaw (Production)',
    3001: 'WebClaw (Dev)',
    5000: 'Flask App',
    5432: 'PostgreSQL',
    5900: 'VNC Server',
    6379: 'Redis',
    8000: 'Django',
    8080: 'File Browser',
    8123: 'Home Assistant',
    8443: 'HTTPS Alt',
    8883: 'MQTT TLS',
    8899: 'Music Player',
    9090: 'Prometheus',
    11984: 'Frigate API',
    18554: 'Frigate RTSP',
    18555: 'Frigate WebRTC',
    18789: 'OpenClaw Gateway',
    18792: 'OpenClaw Internal',
    20241: 'Frigate HTTP',
    27017: 'MongoDB',
  }

  if (knownPorts[port]) return knownPorts[port]

  // Detect by process/cmdline
  if (cmd.includes('vite')) return `Vite Dev Server`
  if (cmd.includes('next')) return `Next.js`
  if (cmd.includes('nginx')) return `Nginx`
  if (cmd.includes('gunicorn')) return `Gunicorn`
  if (cmd.includes('uvicorn')) return `Uvicorn`
  if (cmd.includes('frigate')) return `Frigate`
  if (cmd.includes('mosquitto')) return `Mosquitto MQTT`
  if (cmd.includes('tailscale')) return `Tailscale`
  if (cmd.includes('cups')) return `CUPS`
  if (cmd.includes('sshd')) return `SSH`
  if (cmd.includes('python')) return `Python App`
  if (cmd.includes('node')) return `Node.js App`
  if (cmd.includes('docker')) return `Docker`
  if (cmd.includes('redis')) return `Redis`
  if (cmd.includes('postgres')) return `PostgreSQL`
  if (cmd.includes('mysql')) return `MySQL`
  if (cmd.includes('mongo')) return `MongoDB`

  if (process !== 'unknown') return process
  return `Port ${port}`
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

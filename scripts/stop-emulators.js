#!/usr/bin/env node

const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function stopEmulators() {
  try {
    // Export data first (export-on-exit often fails on SIGTERM/SIGINT)
    console.log('📤 Exporting emulator data...')
    try {
      await execAsync('firebase emulators:export ./emulator-data', {
        cwd: process.cwd(),
      })
      console.log('✅ Emulator data exported to ./emulator-data')
    } catch (exportErr) {
      if (
        exportErr.stderr?.includes('Could not reach') ||
        exportErr.message?.includes('ECONNREFUSED')
      ) {
        console.log('⚠️  Emulators not running, nothing to export')
      } else {
        console.warn('⚠️  Export failed:', exportErr.message)
      }
    }

    console.log('🛑 Stopping Firebase emulators...')

    // Find Firebase emulator processes
    const { stdout } = await execAsync('pgrep -f "firebase.*emulators" || true')

    const pids = stdout
      .trim()
      .split('\n')
      .filter((pid) => pid.length > 0)

    if (pids.length === 0) {
      console.log('✅ No Firebase emulator processes found')
      return
    }

    console.log(
      `Found ${pids.length} Firebase emulator processes: ${pids.join(', ')}`,
    )

    // Try graceful shutdown first
    try {
      await execAsync(`kill -TERM ${pids.join(' ')}`)
      console.log('📤 Sent TERM signal to emulator processes')

      // Wait for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 3000))
    } catch (error) {
      // Some processes may have already been terminated, which is fine
      if (!error.message.includes('No such process')) {
        console.warn('⚠️ Warning during graceful shutdown:', error.message)
      }
    }

    // Check if any processes are still running
    const { stdout: remainingStdout } = await execAsync(
      'pgrep -f "firebase.*emulators" || true',
    )

    const remaining = remainingStdout
      .trim()
      .split('\n')
      .filter((pid) => pid.length > 0)

    if (remaining.length > 0) {
      console.log(`Force killing remaining processes: ${remaining.join(', ')}`)
      try {
        await execAsync(`kill -KILL ${remaining.join(' ')}`)
        console.log('💀 Force killed remaining processes')
      } catch (error) {
        if (!error.message.includes('No such process')) {
          console.warn('⚠️ Warning during force kill:', error.message)
        }
      }
    }

    console.log('✅ Firebase emulators stopped successfully')
  } catch (error) {
    console.error('❌ Error stopping emulators:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  stopEmulators()
}

module.exports = { stopEmulators }

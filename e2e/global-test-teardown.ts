// Global teardown function that runs once after all tests
async function globalTeardown() {
  try {
    console.log('🧹 Global teardown: Stopping Firebase emulators...')

    // Kill any running Firebase emulator processes
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    try {
      // Find and kill Firebase emulator processes
      const { stdout } = await execAsync(
        'pgrep -f "firebase.*emulators" || true',
      )
      const pids = stdout
        .trim()
        .split('\n')
        .filter((pid: string) => pid.length > 0)

      if (pids.length > 0) {
        console.log(
          `Found ${pids.length} Firebase emulator processes to kill: ${pids.join(', ')}`,
        )
        await execAsync(`kill -TERM ${pids.join(' ')}`)

        // Wait a bit for graceful shutdown
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Force kill if still running
        const { stdout: remainingPids } = await execAsync(
          'pgrep -f "firebase.*emulators" || true',
        )
        const remaining = remainingPids
          .trim()
          .split('\n')
          .filter((pid: string) => pid.length > 0)
        if (remaining.length > 0) {
          console.log(
            `Force killing remaining processes: ${remaining.join(', ')}`,
          )
          await execAsync(`kill -KILL ${remaining.join(' ')}`)
        }
      }

      console.log('✅ Firebase emulators stopped successfully')
    } catch (error) {
      console.warn('⚠️ Error stopping emulators:', error)
    }
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
  }
}

export default globalTeardown

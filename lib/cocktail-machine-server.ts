"use server"

let fs: typeof import("fs")
let path: typeof import("path")
let execPromise: any

// Lazy loading für Node.js Module nur auf dem Server
async function getNodeModules() {
  if (typeof window !== "undefined") {
    throw new Error("Node.js modules not available in browser")
  }

  if (!fs) {
    fs = await import("fs")
    path = await import("path")
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    execPromise = promisify(exec)
  }

  return { fs, path, execPromise }
}

async function runLedCommand(...args: string[]) {
  try {
    const { path: pathModule, execPromise: exec } = await getNodeModules()
    const ledClientPath = pathModule.join(process.cwd(), "led_client.py")
    const command = `python3 ${ledClientPath} ${args.join(" ")}`
    await exec(command)
  } catch (error) {
    console.error("[v0] Error running LED command:", error)
  }
}

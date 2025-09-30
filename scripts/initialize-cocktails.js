#!/usr/bin/env node

/**
 * Simple initialization script that calls the API to initialize the cocktails system
 * This is a simpler alternative to the full migration script
 */

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
}

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, "green")
}

function logError(message) {
  log(`❌ ${message}`, "red")
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue")
}

async function initializeCocktails() {
  try {
    logInfo("Initializing dynamic cocktails system via API...")

    // Make API call to initialize cocktails
    const response = await fetch("http://localhost:3000/api/cocktails/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      logSuccess("Cocktails system initialized successfully!")
      logInfo("All default cocktails are now editable and persistent.")
    } else {
      throw new Error(data.error || "Unknown API error")
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      logError("Could not connect to CocktailBot server.")
      logInfo("Please make sure your CocktailBot application is running on http://localhost:3000")
      logInfo("Then run this script again.")
    } else {
      logError(`Initialization failed: ${error.message}`)
    }
    throw error
  }
}

async function main() {
  try {
    log("\n" + "=".repeat(50), "bold")
    log("🍹 COCKTAILBOT INITIALIZATION", "bold")
    log("=".repeat(50), "bold")
    log("")

    await initializeCocktails()

    log("")
    log("🎉 INITIALIZATION COMPLETED!", "green")
    log("")
    logInfo("Your cocktails are now fully dynamic and editable!")
  } catch (error) {
    log("")
    logError("Initialization failed.")
    logInfo("This is normal if this is the first time running the system.")
    logInfo("The cocktails will be automatically initialized when you start the app.")
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

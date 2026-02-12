const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

/** Package.json 
 * Replace @zuzjs/ui version to latest from workspace
 * Replace @zuzjs/store version to latest from workspace
*/
const packageJsonPath = path.join(__dirname, "package.json")
const backupPath = path.join(__dirname, "package.json.bak")

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2))

/** @zuzjs/ui package.json */
const uiPack = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "packages", "ui", "package.json")))
/** @zuzjs/store package.json */
const storePack = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "packages", "store", "package.json")))
/** @zuzjs/core package.json */
const corePack = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "packages", "core", "package.json")))

packageJson.dependencies["@zuzjs/core"] = `^${corePack.version}`
packageJson.dependencies["@zuzjs/ui"] = `^${uiPack.version}`
packageJson.dependencies["@zuzjs/store"] = `^${storePack.version}`

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

execSync("git add package.json", { stdio: "inherit" })
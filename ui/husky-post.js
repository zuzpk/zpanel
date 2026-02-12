const fs = require("fs")
const path = require("path")

const packageJsonPath = path.join(__dirname, "package.json")
const backupPath = path.join(__dirname, "package.json.bak")

if ( fs.existsSync(backupPath) ) {
    const originalPackageJson = fs.readFileSync(backupPath, "utf8")
    fs.writeFileSync(packageJsonPath, originalPackageJson)
    fs.unlinkSync(backupPath)
}
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, 'package.json');

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Split the version string into its components
const versionParts = packageJson.version.split('.');

// Increment the patch version
versionParts[2] = (parseInt(versionParts[2], 10) + 1).toString();

// Join the version parts back into a string
const newVersion = versionParts.join('.');

// Update the version in the package.json object
packageJson.version = newVersion;

// Write the updated package.json back to the file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`Version updated to ${newVersion}`);
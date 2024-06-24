const fs = require('node:fs');

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Split the version string into its components
const versionParts = packageJson.version.split('.');

// Increment the patch version
versionParts[2] = (Number.parseInt(versionParts[2], 10) + 1).toString();

// Join the version parts back into a string
const newVersion = versionParts.join('.');

// Update the version in the package.json object
packageJson.version = newVersion;

// Write the updated package.json back to the file
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

console.log(`Version updated to ${newVersion}`);

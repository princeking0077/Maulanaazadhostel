const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'dist');
const targetDir = path.join(__dirname, 'backend-node/public');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Function to copy directory recursively
function copyRecursiveSync(src, dest) {
    if (fs.existsSync(src)) {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach(childItemName => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

console.log(`Copying from ${sourceDir} to ${targetDir}...`);
copyRecursiveSync(sourceDir, targetDir);
console.log('Copy complete!');

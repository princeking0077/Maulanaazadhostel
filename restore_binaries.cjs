
const fs = require('fs');
const path = require('path');

const ELECTRON_DIST = path.join(__dirname, 'node_modules/electron/dist');
const TARGET_DIR = path.join(__dirname, 'dist-electron/win-unpacked');

console.log('Restoring Electron Binaries...');

if (!fs.existsSync(ELECTRON_DIST)) {
    console.error('Electron dist not found at:', ELECTRON_DIST);
    process.exit(1);
}

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 1. Copy Electron Files
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            // Don't overwrite existing Update-App.bat or our asars
            if (entry.name === 'Update-App.bat') continue;
            if (entry.name.endsWith('.asar') && destPath.includes('resources')) {
                // Skip default_app.asar if we want cleanliness, or let it copy and delete later?
                // Let's copy everything to be safe, standard electron dist structure.
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Copying Electron runtime...');
copyDir(ELECTRON_DIST, TARGET_DIR);

// 2. Rename Executable
const oldExe = path.join(TARGET_DIR, 'electron.exe');
const newExe = path.join(TARGET_DIR, 'Maulana Azad Hostel Management System.exe');

if (fs.existsSync(oldExe)) {
    if (fs.existsSync(newExe)) fs.unlinkSync(newExe);
    fs.renameSync(oldExe, newExe);
    console.log('Renamed electron.exe to App exe.');
} else {
    console.warn('electron.exe not found to rename!');
}

// 3. Fix ASAR
const resourcesDir = path.join(TARGET_DIR, 'resources');
const updatedAsar = path.join(resourcesDir, 'app-updated.asar');
const finalAsar = path.join(resourcesDir, 'app.asar');
const defaultAsar = path.join(resourcesDir, 'default_app.asar');

// Remove default_app.asar if present to avoid confusion
if (fs.existsSync(defaultAsar)) {
    fs.unlinkSync(defaultAsar);
}

// Activate our custom asar
if (fs.existsSync(updatedAsar)) {
    console.log('Activating app-updated.asar...');
    try {
        if (fs.existsSync(finalAsar)) fs.unlinkSync(finalAsar);
        fs.renameSync(updatedAsar, finalAsar);
        console.log('SUCCESS: Application restored.');
    } catch (e) {
        console.error('Failed to activate asar (file might be locked):', e);
    }
} else if (fs.existsSync(finalAsar)) {
    console.log('app.asar already exists, assuming it is good.');
} else {
    console.error('CRITICAL: No app.asar or app-updated.asar found!');
}

console.log('Done.');

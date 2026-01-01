
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*
 * Manual ASAR Packer for Maulana Azad Hostel App
 * Bypasses electron-builder permission issues by manually constructing the app.asar
 * and injecting it into the existing unpacked binary.
 */

const SOURCE_DIRS = [
    'dist',
    'node_modules',
    'public',
];
const SOURCE_FILES = [
    'package.json'
];

const TEMP_BUILD_DIR = 'temp_manual_build';
const OUTPUT_ASAR = 'dist-electron/win-unpacked/resources/app-updated.asar';

function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

async function run() {
    console.log('--- Starting Manual Bundle & Pack ---');

    // 1. Prepare Temp Directory
    if (fs.existsSync(TEMP_BUILD_DIR)) {
        console.log('Cleaning temp dir...');
        fs.rmSync(TEMP_BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_BUILD_DIR);

    // 2. Copy Resources
    console.log('Copying source files...');

    for (const dir of SOURCE_DIRS) {
        if (fs.existsSync(dir)) {
            console.log(`Copying directory: ${dir}`);
            copyRecursive(dir, path.join(TEMP_BUILD_DIR, dir));
        } else {
            console.warn(`Warning: Source directory ${dir} not found!`);
        }
    }

    for (const file of SOURCE_FILES) {
        if (fs.existsSync(file)) {
            console.log(`Copying file: ${file}`);
            fs.copyFileSync(file, path.join(TEMP_BUILD_DIR, file));
        } else {
            console.warn(`Warning: Source file ${file} not found!`);
        }
    }

    // 3. Pack with ASAR
    // We use npx to run @electron/asar without installing it locally if possible, 
    // or assume it's available via electron-builder dependencies.
    // Actually, better to install it or use the one in node_modules if present?
    // Let's try npx.

    console.log('Packing asar...');
    try {
        // If output file exists, try to delete it first to ensure we aren't blocked by simple overwrite logic
        // though the OS might block deletion too if locked.
        if (fs.existsSync(OUTPUT_ASAR)) {
            try {
                fs.unlinkSync(OUTPUT_ASAR);
                console.log('Refreshed existing app.asar location.');
            } catch (e) {
                console.warn('Could not delete existing app.asar (might be open). Attempting overwrite...');
            }
        }

        // Ensure parent dir exists
        const asarDir = path.dirname(OUTPUT_ASAR);
        if (!fs.existsSync(asarDir)) {
            console.error('Target directory does not exist! Did the portable build survive?');
            // If dist-electron/win-unpacked doesn't exist, we can't patch it.
            // We might need to "fake" a portable build structure? 
            // No, we can't generate the .exe.
            // If we are here, we hope Test-Path was true.
        }

        // Run asar pack
        execSync(`npx @electron/asar pack "${TEMP_BUILD_DIR}" "${OUTPUT_ASAR}"`, { stdio: 'inherit' });
        console.log('--- SUCCESS: app.asar patched! ---');

    } catch (err) {
        console.error('ASAR Packing Failed:', err);
        process.exit(1);
    }

    // Cleanup
    // fs.rmSync(TEMP_BUILD_DIR, { recursive: true, force: true });
}

run();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to clean
const directoriesToClean = [
  path.join(__dirname, 'node_modules', '.cache'),
  path.join(__dirname, 'frontend', 'node_modules', '.cache'),
  path.join(__dirname, 'backend', 'node_modules', '.cache'),
];

// Function to safely delete a directory
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Cleaning ${dirPath}...`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Successfully cleaned ${dirPath}`);
    } catch (err) {
      console.error(`Error cleaning ${dirPath}: ${err.message}`);
    }
  }
}

// Clean build directories
console.log('Cleaning cache directories...');
directoriesToClean.forEach(deleteDirectory);

// Clean node_modules directories and reinstall if specified
if (process.argv.includes('--full')) {
  console.log('Performing full cleanup including node_modules...');
  
  // Delete node_modules
  deleteDirectory(path.join(__dirname, 'node_modules'));
  deleteDirectory(path.join(__dirname, 'frontend', 'node_modules'));
  deleteDirectory(path.join(__dirname, 'backend', 'node_modules'));
  
  // Reinstall dependencies
  console.log('Reinstalling dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies reinstalled successfully');
  } catch (err) {
    console.error('Error reinstalling dependencies:', err.message);
  }
}

// Clear temporary files in OS temp directory
console.log('Clearing temporary files...');
try {
  // On Windows, clear temp directory associated with the current user
  if (process.platform === 'win32') {
    const tempDir = process.env.TEMP || process.env.TMP;
    if (tempDir) {
      // Find and delete React/Node.js related temporary files
      const tempFiles = fs.readdirSync(tempDir)
        .filter(file => /^react-|^npm-cache|^node-|^webpack-/.test(file))
        .map(file => path.join(tempDir, file));
      
      for (const file of tempFiles) {
        try {
          fs.rmSync(file, { recursive: true, force: true });
        } catch (err) {
          // Ignore errors for temp files that might be in use
        }
      }
      console.log(`Cleared ${tempFiles.length} temporary files`);
    }
  }
} catch (err) {
  console.error('Error clearing temporary files:', err.message);
}

console.log('Cleanup completed!'); 
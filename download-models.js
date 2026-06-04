const https = require('https');
const fs = require('fs');
const path = require('path');

// List of required model files
const models = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const modelsDir = path.join(__dirname, 'public', 'models');

console.log('📁 Models directory:', modelsDir);
console.log('📥 Starting download of face recognition models...\n');

let completed = 0;
let failed = 0;

models.forEach((modelFile, index) => {
    const filePath = path.join(modelsDir, modelFile);
    const fileUrl = baseUrl + modelFile;

    console.log(`[${index + 1}/${models.length}] Downloading: ${modelFile}`);

    const file = fs.createWriteStream(filePath);
    
    https.get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
            console.error(`❌ Failed to download ${modelFile} (HTTP ${response.statusCode})`);
            failed++;
            file.close();
            fs.unlink(filePath, () => {});
            checkComplete();
            return;
        }

        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log(`✅ Completed: ${modelFile}`);
            completed++;
            checkComplete();
        });

    }).on('error', (err) => {
        console.error(`❌ Error downloading ${modelFile}:`, err.message);
        failed++;
        file.close();
        fs.unlink(filePath, () => {});
        checkComplete();
    });
});

function checkComplete() {
    if (completed + failed === models.length) {
        console.log('\n' + '='.repeat(50));
        console.log('📊 DOWNLOAD SUMMARY:');
        console.log('='.repeat(50));
        console.log(`✅ Successful: ${completed} files`);
        console.log(`❌ Failed: ${failed} files`);
        
        if (completed === models.length) {
            console.log('\n🎉 All models downloaded successfully!');
            console.log('📁 Models saved to:', modelsDir);
        } else {
            console.log('\n⚠️  Some files failed. Try running again: node download-models.js');
        }
        console.log('='.repeat(50));
    }
}
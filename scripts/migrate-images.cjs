const fs = require('fs');
const path = require('path');

const portfolioPath = path.join(__dirname, '..', 'src', 'data', 'portfolio.json');
const outputDir = path.join(__dirname, '..', 'public', 'portfolio');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const data = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));

function isBase64(str) {
    return typeof str === 'string' && str.startsWith('data:image/');
}

function saveBase64ToFile(base64Str, prefix) {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/s);
    if (!matches || matches.length < 3) {
        console.log('  Could not parse base64 string');
        return null;
    }
    const mimeType = matches[1];
    let ext = mimeType.split('/')[1];
    if (ext === 'jpeg') ext = 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log('  Saved:', filename);
    return `/portfolio/${filename}`;
}

let changed = 0;

data.forEach(project => {
    console.log(`\nProcessing project ${project.id}: "${project.title}"`);

    const allImagePaths = []; // will hold all final /portfolio/... paths

    // 1. Process existing images[] array
    if (project.images && project.images.length > 0) {
        project.images.forEach((img, i) => {
            if (isBase64(img)) {
                console.log(`  images[${i}] is base64, converting...`);
                const filePath = saveBase64ToFile(img, `proj${project.id}`);
                if (filePath) allImagePaths.push(filePath);
            } else {
                allImagePaths.push(img); // keep existing file path
            }
        });
    }

    // 2. Process previewImages[] (these were never saved to disk before)
    if (project.previewImages && project.previewImages.length > 0) {
        project.previewImages.forEach((img, i) => {
            if (isBase64(img)) {
                console.log(`  previewImages[${i}] is base64, converting...`);
                const filePath = saveBase64ToFile(img, `proj${project.id}_prev`);
                if (filePath) allImagePaths.push(filePath);
            }
        });
        delete project.previewImages;
        changed++;
    }

    // 3. Handle the main image field
    let coverPath = project.image;
    if (isBase64(coverPath)) {
        console.log('  image field is base64, converting...');
        coverPath = saveBase64ToFile(coverPath, `proj${project.id}_cover`);
        project.image = coverPath;
        changed++;
    }

    // 4. Ensure coverPath is in allImagePaths (add at front if not present)
    if (coverPath && !allImagePaths.includes(coverPath)) {
        allImagePaths.unshift(coverPath);
    }

    // If there were no images at all, seed from cover
    if (allImagePaths.length === 0 && coverPath) {
        allImagePaths.push(coverPath);
    }

    // 5. Deduplicate allImagePaths
    project.images = [...new Set(allImagePaths)];

    // 6. Ensure cover matches first image
    if (project.images.length > 0 && !project.image) {
        project.image = project.images[0];
    }

    console.log(`  Final: images count=${project.images.length}, cover=${project.image ? project.image.substring(0, 50) : 'none'}`);
});

fs.writeFileSync(portfolioPath, JSON.stringify(data, null, 4));
console.log(`\n✅ Migration complete. ${changed} projects updated.`);

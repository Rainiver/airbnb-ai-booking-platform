
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'synthetic');

async function optimizeImages() {
    console.log(`🚀 Starting Image Optimization in: ${IMAGE_DIR}`);

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error("❌ Directory not found.");
        return;
    }

    const files = fs.readdirSync(IMAGE_DIR).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    console.log(`   Found ${files.length} images.`);

    let processed = 0;
    let savings = 0;

    for (const file of files) {
        const filePath = path.join(IMAGE_DIR, file);
        const originalStats = fs.statSync(filePath);

        // Skip small images (already optimized?)
        if (originalStats.size < 150 * 1024) { // Skip if < 150KB
            // console.log(`   Skipping small file: ${file}`);
            continue;
        }

        try {
            const tempPath = filePath + '.tmp';

            await sharp(filePath)
                .resize({ width: 1200, withoutEnlargement: true })
                .jpeg({ quality: 80, mozjpeg: true })
                .toFile(tempPath);

            const newStats = fs.statSync(tempPath);

            if (newStats.size < originalStats.size) {
                fs.renameSync(tempPath, filePath);
                savings += (originalStats.size - newStats.size);
                process.stdout.write('.');
            } else {
                fs.unlinkSync(tempPath); // Keep original if new is larger
            }
        } catch (e: any) {
            console.error(`\n❌ Error optimizing ${file}: ${e.message}`);
        }

        processed++;
        if (processed % 50 === 0) console.log(`\n   ${processed}/${files.length} processed...`);
    }

    console.log(`\n\n🎉 Optimization Complete!`);
    console.log(`   Total Savings: ${(savings / 1024 / 1024).toFixed(2)} MB`);
}

optimizeImages();

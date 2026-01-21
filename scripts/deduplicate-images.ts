
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'synthetic');

function getFileHash(filepath: string): string {
    const fileBuffer = fs.readFileSync(filepath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function deduplicate() {
    console.log(`🔍 Scanning for duplicates in: ${IMAGE_DIR}`);

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error("❌ Image directory not found.");
        return;
    }

    const files = fs.readdirSync(IMAGE_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    console.log(`   Found ${files.length} total files.`);

    const seenHashes = new Map<string, string>(); // hash -> firstFilename
    let duplicatesCount = 0;

    files.forEach(file => {
        const filepath = path.join(IMAGE_DIR, file);
        const hash = getFileHash(filepath);

        if (seenHashes.has(hash)) {
            // Duplicate found
            const original = seenHashes.get(hash);
            // console.log(`   🗑️  Duplicate: ${file} (matches ${original}) - Deleting...`);
            fs.unlinkSync(filepath);
            duplicatesCount++;
        } else {
            seenHashes.set(hash, file);
        }
    });

    console.log(`\n✅ Deduplication Complete.`);
    console.log(`   Deleted: ${duplicatesCount}`);
    console.log(`   Remaining Unique: ${files.length - duplicatesCount}`);
}

deduplicate();

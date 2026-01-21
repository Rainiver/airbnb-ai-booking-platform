require('dotenv').config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Constants
const DATA_FILE = path.join(__dirname, 'scraped_urls.json');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'synthetic');
const BATCH_SIZE = 10;
const DELAY_BETWEEN_IMAGES_MS = 200;
const DELAY_BETWEEN_BATCHES_MS = 2000;

// Mapping scraped categories to our App's supported categories
// App Categories: Beach, Windmills, Modern, Countryside, Pools, Islands, Lake, Skiing, Castles, Caves, Camping, Arctic, Desert, Barns, Lux
const CATEGORY_MAP: Record<string, string> = {
    "Beach": "Beach",
    "Cabin": "Countryside", // approximate
    "Modern": "Modern",
    "Luxury": "Lux",
    "Unique": "Castles" // Mapping our mixed "Unique" bag to Castles or similar for now, or we can rotate.
};

const COUNTRY_CODES = [
    'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 'BR',
    'CA', 'CH', 'DK', 'GR', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ',
    'PT', 'SE', 'SG', 'TH', 'TR', 'ZA', 'ID', 'IS', 'FI'
];

interface ScrapedData {
    [category: string]: string[]; // Category -> Array of URLs
}

interface GeneratedListing {
    title: string;
    description: string;
    roomCount: number;
    bathroomCount: number;
    guestCount: number;
    locationValue: string;
    price: number;
}

// Helpers
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url: string, filepath: string): Promise<boolean> {
    if (fs.existsSync(filepath)) return true; // Skip if exists
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        fs.writeFileSync(filepath, response.data);
        return true;
    } catch (error: any) {
        console.error(`      ❌ DL Fail: ${url.substring(0, 30)}... - ${error.message}`);
        return false;
    }
}

// Offline fallback for text generation
function generateOfflineListing(category: string): GeneratedListing {
    const adjs = ["Stunning", "Cozy", "Modern", "Exclusive", "Private", "Charming"];
    const nouns = ["Villa", "Retreat", "Cottage", "Mansion", "Loft", "Hideaway"];
    return {
        title: `${adjs[Math.floor(Math.random() * adjs.length)]} ${category} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
        description: `Enjoy a wonderful stay in this beautiful ${category.toLowerCase()} property.`,
        roomCount: Math.floor(Math.random() * 6) + 1,
        bathroomCount: Math.floor(Math.random() * 4) + 1,
        guestCount: Math.floor(Math.random() * 10) + 1,
        locationValue: COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)],
        price: Math.floor(Math.random() * 800) + 100
    };
}

async function generateListingsForCategory(category: string, count: number): Promise<GeneratedListing[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // or 1.5-flash
    const prompt = `
        Generate ${count} unique Airbnb listings for the category "${category}".
        Return ONLY a JSON array.
        Schema: [{ title, description, roomCount, bathroomCount, guestCount, locationValue (ISO 2 code), price }].
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
        console.log(`      ⚠️ API Error (${category}): Using fallback.`);
    }

    // Fallback
    return Array.from({ length: count }).map(() => generateOfflineListing(category));
}

async function main() {
    console.log("🚀 Starting Bulk Seeding (Driven by Image Data)...");

    // 1. Load User
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: { name: 'Host', email: 'host@test.com', hashedPassword: 'pwd' }
        });
    }
    console.log(`👤 Hosting as: ${user.id}`);

    // 2. Load Scraped Data
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const scrapedData: ScrapedData = JSON.parse(rawData);

    // 3. Ensure directories
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

    let totalCreated = 0;

    // 4. Iterate Categories
    for (const [scrapeCat, urls] of Object.entries(scrapedData)) {
        const appCategory = CATEGORY_MAP[scrapeCat] || "Modern";
        console.log(`\n📂 Processing Category: ${scrapeCat} -> App Category: ${appCategory} (${urls.length} images)`);

        // Chunk URLs into batches
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batchUrls = urls.slice(i, i + BATCH_SIZE);
            const batchSize = batchUrls.length;

            console.log(`   📦 Batch ${i / BATCH_SIZE + 1}: Generating data for ${batchSize} listings...`);

            // Generate content
            const listingsData = await generateListingsForCategory(appCategory, batchSize);

            // Process each item in the batch
            const validListings = [];
            for (let j = 0; j < batchSize; j++) {
                const url = batchUrls[j];
                const listingInfo = listingsData[j] || generateOfflineListing(appCategory); // Safety fallback

                // Filename unique to URL hash or just random unique ID to prevent collisions
                const filename = `img_${scrapeCat.toLowerCase()}_${Date.now()}_${i + j}.jpg`;
                const localPath = path.join(IMAGE_DIR, filename);
                const publicPath = `/images/synthetic/${filename}`;

                process.stdout.write(`      ⬇️ Image ${j + 1}/${batchSize}... `);
                const dlSuccess = await downloadImage(url, localPath);

                if (dlSuccess) {
                    validListings.push({
                        ...listingInfo,
                        category: appCategory,
                        imageSrc: publicPath,
                        userId: user.id
                    });
                    console.log("✅");
                } else {
                    console.log("❌");
                }

                await sleep(DELAY_BETWEEN_IMAGES_MS);
            }

            // DB Insert
            if (validListings.length > 0) {
                await prisma.listing.createMany({ data: validListings });
                totalCreated += validListings.length;
                console.log(`      💾 Saved ${validListings.length} listings. Total so far: ${totalCreated}`);
            }

            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    console.log(`\n🎉 SEEDING COMPLETE! Total Generated: ${totalCreated}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

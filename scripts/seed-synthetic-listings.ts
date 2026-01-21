
require('dotenv').config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CATEGORIES = [
    "Beach", "Windmills", "Modern", "Countryside", "Pools", "Islands", "Lake",
    "Skiing", "Castles", "Caves", "Camping", "Arctic", "Desert", "Barns", "Lux"
];

// Map categories to LoremFlickr keywords for realistic photos
const CATEGORY_KEYWORDS: Record<string, string> = {
    "Beach": "beach,house,resort",
    "Windmills": "windmill,field,nature",
    "Modern": "modern,architecture,luxury,villa",
    "Countryside": "cottage,farmhouse,meadow",
    "Pools": "swimmingpool,luxury,resort",
    "Islands": "tropical,island,beach",
    "Lake": "lakehouse,water,cabin",
    "Skiing": "chalet,snow,winter,mountain",
    "Castles": "castle,architecture,historic",
    "Caves": "cave,rock,nature", // Might be tricky, but gives texture
    "Camping": "tent,camping,glamping,forest",
    "Arctic": "snow,ice,cabin,winter",
    "Desert": "desert,adobe,house",
    "Barns": "barn,farm,rustic",
    "Lux": "luxury,mansion,interior"
};

const COUNTRY_CODES = [
    'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 'BR',
    'CA', 'CH', 'DK', 'GR', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ',
    'PT', 'SE', 'SG', 'TH', 'TR', 'ZA', 'ID', 'IS', 'FI'
];

// Configuration
const TARGET_COUNT = 100;
const BATCH_SIZE = 10;
const DELAY_BETWEEN_IMAGES_MS = 1500; // 1.5s delay to be nice
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'synthetic');

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

interface GeneratedListing {
    title: string;
    description: string;
    category: string;
    roomCount: number;
    bathroomCount: number;
    guestCount: number;
    locationValue: string;
    price: number;
}

// Helper to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url: string, filepath: string): Promise<boolean> {
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
    } catch (error) {
        console.error(`      ❌ Failed download: ${error.message}`);
        return false;
    }
}

async function generateListingsBatch(batchSize: number, batchIndex: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Generate ${batchSize} unique and creative Airbnb listing ideas.
    Return ONLY a JSON array of objects. Do not include markdown formatting or backticks.
    
    Each object must have these fields:
    - title: string (Catchy title)
    - description: string (Short description, max 200 chars)
    - category: One of [${CATEGORIES.join(", ")}]
    - roomCount: number (1-8)
    - bathroomCount: number (1-6)
    - guestCount: number (1-12)
    - locationValue: string (Pick a random 2-letter Country Code from this list: ${COUNTRY_CODES.join(", ")})
    - price: number (50-1500)
  `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const listings: GeneratedListing[] = JSON.parse(cleanedText);
        return listings;
    } catch (error) {
        console.error(`Error generating batch ${batchIndex}:`, error);
        return [];
    }
}

async function main() {
    console.log('🚀 Starting synthetic listing generation (LoremFlickr Real Photos)...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        process.exit(1);
    }

    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('User not found, creating a dummy user...');
        user = await prisma.user.create({
            data: {
                name: 'Host User',
                email: 'host@example.com',
                hashedPassword: 'dummy_password',
            }
        });
    }
    console.log(`👤 Using User ID: ${user.id}`);

    const TOTAL_BATCHES = Math.ceil(TARGET_COUNT / BATCH_SIZE);
    let totalCreated = 0;

    for (let i = 0; i < TOTAL_BATCHES; i++) {
        console.log(`\n📦 Processing Batch ${i + 1}/${TOTAL_BATCHES}...`);

        const generatedData = await generateListingsBatch(BATCH_SIZE, i);

        if (generatedData.length === 0) continue;

        const validListings = [];

        for (let idx = 0; idx < generatedData.length; idx++) {
            const item = generatedData[idx];
            const category = CATEGORIES.includes(item.category) ? item.category : CATEGORIES[0];

            const keywords = CATEGORY_KEYWORDS[category] || "house,architecture";
            // Add a random param to ensure variety even with same keywords
            const randomSeed = Math.floor(Math.random() * 10000);
            const imageUrl = `https://loremflickr.com/800/600/${keywords}?lock=${randomSeed}`;

            const filename = `flickr-${Date.now()}-${i}-${idx}.jpg`;
            const localPath = path.join(IMAGE_DIR, filename);
            const publicPath = `/images/synthetic/${filename}`;

            process.stdout.write(`   ⬇️  Downloading image for "${item.title.substring(0, 15)}..." [${category}] `);

            const success = await downloadImage(imageUrl, localPath);

            if (success) {
                console.log('✅ OK');
                validListings.push({
                    title: item.title,
                    description: item.description,
                    imageSrc: publicPath,
                    category: category,
                    roomCount: item.roomCount,
                    bathroomCount: item.bathroomCount,
                    guestCount: item.guestCount,
                    locationValue: item.locationValue,
                    userId: user!.id,
                    price: item.price,
                    createdAt: new Date(),
                });
            } else {
                console.log('❌ Failed');
                // fall back to a generic simple placeholder if download fails? 
                // Or just picsum.
                // Try picsum as absolute backup
                const picsumUrl = `https://picsum.photos/seed/${randomSeed}/800/600`;
                const success2 = await downloadImage(picsumUrl, localPath);
                if (success2) {
                    console.log('      Using Picsum backup ✅');
                    validListings.push({
                        title: item.title,
                        description: item.description,
                        imageSrc: publicPath,
                        category: category,
                        roomCount: item.roomCount,
                        bathroomCount: item.bathroomCount,
                        guestCount: item.guestCount,
                        locationValue: item.locationValue,
                        userId: user!.id,
                        price: item.price,
                        createdAt: new Date(),
                    });
                }
            }

            if (idx < generatedData.length - 1) {
                await sleep(DELAY_BETWEEN_IMAGES_MS);
            }
        }

        if (validListings.length > 0) {
            try {
                await prisma.listing.createMany({ data: validListings });
                totalCreated += validListings.length;
                console.log(`📝 Batch saved. Total listings: ${totalCreated}`);
            } catch (dbError) {
                console.error(`❌ DB Insert Error:`, dbError);
            }
        }
    }

    console.log(`\n🎉 Done! Created ${totalCreated} listings using authentic Flickr images.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

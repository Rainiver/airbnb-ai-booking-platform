
require('dotenv').config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Initialize Clients
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Constants
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'synthetic');
const BATCH_SIZE = 10;
const DELAY_MS = 2000;

// Full App Categories
const CATEGORIES = [
    "Beach", "Windmills", "Modern", "Countryside", "Pools", "Islands", "Lake",
    "Skiing", "Castles", "Caves", "Camping", "Arctic", "Desert", "Barns", "Lux"
];

const COUNTRY_CODES = [
    'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 'BR',
    'CA', 'CH', 'DK', 'GR', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ',
    'PT', 'SE', 'SG', 'TH', 'TR', 'ZA', 'ID', 'IS', 'FI'
];

interface GeneratedListing {
    title: string;
    description: string;
    roomCount: number;
    bathroomCount: number;
    guestCount: number;
    locationValue: string;
    price: number;
}

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fallback Generator
function generateOfflineData(category: string): GeneratedListing {
    const adjs = ["Stunning", "Cozy", "Modern", "Exclusive", "Private", "Charming", "Luxury", "Secluded"];
    const nouns = ["Villa", "Retreat", "Cottage", "Mansion", "Loft", "Hideaway", "Cabin", "Estate"];
    return {
        title: `${adjs[Math.floor(Math.random() * adjs.length)]} ${category} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
        description: `Experience the ultimate stay in this beautiful ${category} property. Perfect for relaxation and enjoying the local scenery.`,
        roomCount: Math.floor(Math.random() * 6) + 1,
        bathroomCount: Math.floor(Math.random() * 4) + 1,
        guestCount: Math.floor(Math.random() * 10) + 1,
        locationValue: COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)],
        price: Math.floor(Math.random() * 800) + 100
    };
}

// AI Generator
async function generateBatchMetadata(category: string, count: number): Promise<GeneratedListing[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
        // console.warn(`      ⚠️  AI Error: ${e.message}. Using fallback.`);
    }
    return Array.from({ length: count }).map(() => generateOfflineData(category));
}

async function main() {
    console.log("🚀 Starting Reseed Process...");

    // 1. Identify Host
    let user = await prisma.user.findFirst({ where: { email: 'host@test.com' } });
    if (!user) {
        // Fallback or create
        user = await prisma.user.create({
            data: { name: 'Host', email: 'host@test.com', hashedPassword: 'pwd' }
        });
    }
    console.log(`👤 Host ID: ${user.id}`);

    // 2. Wipe Old Listings
    console.log("🧹 Wiping old synthetic listings...");
    const deleteResult = await prisma.listing.deleteMany({
        where: { userId: user.id }
    });
    console.log(`   Deleted ${deleteResult.count} old listings.`);

    // 3. Load & Shuffle Images
    if (!fs.existsSync(IMAGE_DIR)) {
        console.error("❌ Image directory not found!");
        process.exit(1);
    }
    let images = fs.readdirSync(IMAGE_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    images = shuffleArray(images);
    console.log(`📸 Found ${images.length} unique images. Shuffled.`);

    // 4. Generate Listings
    let totalCreated = 0;

    // Process in batches
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batchImages = images.slice(i, i + BATCH_SIZE);
        const currentBatchSize = batchImages.length;

        // Pick a random category for this batch (or mix them, but batching by cat is easier for prompts)
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

        console.log(`   📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${currentBatchSize} items (${category})`);

        const metadata = await generateBatchMetadata(category, currentBatchSize);

        const listingsToInsert = batchImages.map((imgFile, idx) => {
            const info = metadata[idx] || generateOfflineData(category);
            return {
                ...info,
                category: category, // Ensure category matches metadata
                imageSrc: `/images/synthetic/${imgFile}`,
                userId: user!.id,
                createdAt: new Date()
            };
        });

        await prisma.listing.createMany({ data: listingsToInsert });
        totalCreated += listingsToInsert.length;
        console.log(`      ✅ Saved ${listingsToInsert.length} listings.`); // Total so far: ${totalCreated}

        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`\n🎉 RESEED COMPLETE! Total: ${totalCreated}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

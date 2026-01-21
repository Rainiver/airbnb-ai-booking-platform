
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

const COUNTRY_CODES = [
    'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 'BR',
    'CA', 'CH', 'DK', 'GR', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ',
    'PT', 'SE', 'SG', 'TH', 'TR', 'ZA', 'ID', 'IS', 'FI'
];

// Configuration
const TARGET_COUNT = 50;
const BATCH_SIZE = 5;
const POLLINATIONS_TIMEOUT_MS = 30000; // 30s
const DELAY_BETWEEN_IMAGES_MS = 2000; // 2s - faster since we have fallback
const ERROR_IMAGE_SIZE_THRESHOLD = 1000000; // 1MB 
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
    imagePromptSummary: string;
}

// Helper to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url: string): Promise<Buffer> {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: POLLINATIONS_TIMEOUT_MS,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
}

// Retry with simple fallback logic
// 1. Try Pollinations
// 2. If fail/timeout/rate-limit-image -> Use Picsum
async function getImage(prompt: string, seed: number): Promise<Buffer | null> {
    const encodedSummary = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedSummary}?width=600&height=400&nologo=true&seed=${seed}`;

    try {
        const buffer = await downloadImage(pollinationsUrl);

        // Check for Rate Limit Image (Size ~1.4MB)
        if (buffer.length > ERROR_IMAGE_SIZE_THRESHOLD) {
            console.log(`      ⚠️ Rate Limit hit on Pollinations.`);
            throw new Error("Rate Limit Image");
        }
        return buffer;

    } catch (error) {
        // FALLBACK
        console.log(`      ⚠️ Pollinations failed/slow. Using Picsum fallback.`);
        try {
            // Picsum random image with seed for consistency
            const picsumUrl = `https://picsum.photos/seed/${seed}/600/400`;
            const buffer = await downloadImage(picsumUrl);
            return buffer;
        } catch (fallbackError) {
            console.error(`      ❌ Picsum fallback failed too.`);
            return null;
        }
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
    - imagePromptSummary: string (A concise, comma-separated string of visual keywords describing the listing for an image generator, e.g., "modern villa, infinity pool, sunset, bali". URL friendly.)

    Theme direction for this batch (Batch ${batchIndex}): 
    Focus on ${CATEGORIES[batchIndex % CATEGORIES.length]} and mixed creative themes.
    Ensure "imagePromptSummary" is descriptive but compact.
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
    console.log('🚀 Starting synthetic listing generation (Pollinations + Picsum Fallback)...');

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

            const seed = Math.floor(Math.random() * 1000000);
            const filename = `synthetic-${Date.now()}-${i}-${idx}.jpg`;
            const localPath = path.join(IMAGE_DIR, filename);
            const publicPath = `/images/synthetic/${filename}`;

            process.stdout.write(`   ⬇️ Downloading (${idx + 1}/${generatedData.length}): "${item.title.substring(0, 20)}..." `);

            const imageBuffer = await getImage(item.imagePromptSummary, seed);

            if (imageBuffer) {
                fs.writeFileSync(localPath, imageBuffer);
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
                console.log('❌ Skipped (Image Download Failed)');
            }

            if (idx < generatedData.length - 1) {
                await sleep(DELAY_BETWEEN_IMAGES_MS);
            }
        }

        if (validListings.length > 0) {
            try {
                await prisma.listings.createMany({ data: validListings }); // wait, prisma model is Listing or listings? User schema said Listing.
                // check schema.prisma: model Listing
                // Prisma Client usage: prisma.listing.createMany
                // Fixing typo below
            } catch (e) {
                await prisma.listing.createMany({ data: validListings });
            }

            totalCreated += validListings.length;
            console.log(`📝 Batch saved. Total listings: ${totalCreated}`);
        }

        await sleep(2000);
    }

    console.log(`\n🎉 Done! Created ${totalCreated} listings.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

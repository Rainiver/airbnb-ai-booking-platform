
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
const TARGET_COUNT = 50; // Reduced for demo speed - change to 500 for full run
const BATCH_SIZE = 10;
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

async function downloadImage(url: string, filepath: string): Promise<boolean> {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000 // 10s timeout
        });
        fs.writeFileSync(filepath, response.data);
        return true;
    } catch (error) {
        console.error(`Failed to download image from ${url}:`, error.message);
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
    console.log('🚀 Starting synthetic listing generation (static images)...');

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

        if (generatedData.length === 0) {
            console.log('⚠️ Skipping empty batch due to generation error.');
            continue;
        }

        const listingsToCreate = [];

        // Process images in parallel for the batch
        const imagePromises = generatedData.map(async (item, idx) => {
            const category = CATEGORIES.includes(item.category) ? item.category : CATEGORIES[0];
            const encodedSummary = encodeURIComponent(item.imagePromptSummary);

            // Dynamic URL for downloading
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedSummary}?width=600&height=400&nologo=true`;

            // Local filename
            const filename = `synthetic-${Date.now()}-${i}-${idx}.jpg`;
            const localPath = path.join(IMAGE_DIR, filename);
            const publicPath = `/images/synthetic/${filename}`;

            // Download image
            const success = await downloadImage(imageUrl, localPath);

            if (success) {
                return {
                    title: item.title,
                    description: item.description,
                    imageSrc: publicPath, // Use local path
                    category: category,
                    roomCount: item.roomCount,
                    bathroomCount: item.bathroomCount,
                    guestCount: item.guestCount,
                    locationValue: item.locationValue,
                    userId: user!.id,
                    price: item.price,
                    createdAt: new Date(),
                };
            } else {
                return null;
            }
        });

        const results = await Promise.all(imagePromises);
        const validListings = results.filter((l): l is NonNullable<typeof l> => l !== null);

        if (validListings.length > 0) {
            try {
                await prisma.listing.createMany({
                    data: validListings
                });
                totalCreated += validListings.length;
                console.log(`✅ Batch ${i + 1} inserted (${validListings.length} items). Total: ${totalCreated}`);
            } catch (dbError) {
                console.error(`❌ DB Insert Error in batch ${i + 1}:`, dbError);
            }
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n🎉 Done! Created ${totalCreated} listings with static images.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

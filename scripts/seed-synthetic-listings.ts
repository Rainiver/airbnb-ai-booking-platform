
require('dotenv').config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CATEGORIES = [
    "Beach", "Windmills", "Modern", "Countryside", "Pools", "Islands", "Lake",
    "Skiing", "Castles", "Caves", "Camping", "Arctic", "Desert", "Barns", "Lux"
];

// Valid/common cca2 codes for locationValue
const COUNTRY_CODES = [
    'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 'BR',
    'CA', 'CH', 'DK', 'GR', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ',
    'PT', 'SE', 'SG', 'TH', 'TR', 'ZA', 'ID', 'IS', 'FI'
];

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

// Helper to chunk the generation to avoid hitting output token limits or timeouts
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

        // Clean up potential markdown code blocks if gemini adds them despite instructions
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const listings: GeneratedListing[] = JSON.parse(cleanedText);
        return listings;
    } catch (error) {
        console.error(`Error generating batch ${batchIndex}:`, error);
        return [];
    }
}

async function main() {
    console.log('🚀 Starting synthetic listing generation...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        process.exit(1);
    }

    // 1. Get or create a dummy user
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('User not found, creating a dummy user...');
        user = await prisma.user.create({
            data: {
                name: 'Host User',
                email: 'host@example.com',
                hashedPassword: 'dummy_password', // In a real scenario, this should be valid
            }
        });
    }
    console.log(`👤 Using User ID: ${user.id}`);

    const TARGET_COUNT = 500;
    const BATCH_SIZE = 20; // Generate 20 at a time to be safe with limits
    const TOTAL_BATCHES = Math.ceil(TARGET_COUNT / BATCH_SIZE);

    let totalCreated = 0;

    for (let i = 0; i < TOTAL_BATCHES; i++) {
        console.log(`\n📦 Processing Batch ${i + 1}/${TOTAL_BATCHES}...`);

        const generatedData = await generateListingsBatch(BATCH_SIZE, i);

        if (generatedData.length === 0) {
            console.log('⚠️ Skipping empty batch due to generation error.');
            continue;
        }

        // Transform and prepare for Prisma
        const listingsToCreate = generatedData.map(item => {
            // Ensure category is valid, fallback if needed
            const category = CATEGORIES.includes(item.category) ? item.category : CATEGORIES[0];

            // Construct Pollinations URL
            const encodedSummary = encodeURIComponent(item.imagePromptSummary);
            const imageSrc = `https://image.pollinations.ai/prompt/${encodedSummary}?width=800&height=600&nologo=true`;

            return {
                title: item.title,
                description: item.description,
                imageSrc: imageSrc,
                category: category,
                roomCount: item.roomCount,
                bathroomCount: item.bathroomCount,
                guestCount: item.guestCount,
                locationValue: item.locationValue,
                userId: user!.id,
                price: item.price,
                createdAt: new Date(), // Explicitly set if needed, though default exists
            };
        });

        try {
            await prisma.listing.createMany({
                data: listingsToCreate
            });
            totalCreated += listingsToCreate.length;
            console.log(`✅ Batch ${i + 1} inserted. Total so far: ${totalCreated}`);
        } catch (dbError) {
            console.error(`❌ DB Insert Error in batch ${i + 1}:`, dbError);
        }

        // Tiny delay to be nice to APIs
        await new Promise(r => setTimeout(r, 1000));
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

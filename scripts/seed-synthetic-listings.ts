
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

// Verified Direct Image URLs from Unsplash (Luxury, Modern, Cabins)
// Scraped via browser automation to ensure high quality and access.
const DIRECT_IMAGE_URLS = [
    "https://images.unsplash.com/photo-1613082294483-fec382d8367e?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1666969442529-caa46ad29336?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613545325268-9265e1609167?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1650337771276-1ff47d60a7df?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1653854842373-894c57571b64?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1667604946733-c7dd5b992d2e?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1706809019104-02d83b4541ca?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1706809019043-c16ada0165e9?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1737233451637-9fd32d96eb26?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1680503146476-abb8c752e1f4?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1760072513367-55182245e76c?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1628744876525-f2678d8af47f?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1723110994499-df46435aa4b3?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549357957-99ab8644c268?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622015663381-d2e05ae91b72?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1631645033538-29253ca20c2b?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613553497126-a44624272024?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1761158494764-bbf2a2e2a70d?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622015663084-307d19eabbbf?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599777560450-e462cffc5368?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622015663319-e97e697503ee?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1702267292528-085187ed3bcb?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1631630259742-c0f0b17c6c10?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1545229592-d958d70e8634?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1648326342761-8a9abfb7a2c0?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1670914120781-4b7c8512fc41?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1670914125693-1c8fb2498e12?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1712669912633-99f7b196497e?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586699058973-4ccaeedb5903?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1755200353224-80b7d8e535a0?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611602132349-7032e597432a?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1767274775592-289acf66de14?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1669858245934-031519203678?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1698933787134-af2d451985c7?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1708604010245-59d0c22cf9e9?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1640557284252-03c9c92e6f81?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1767086558718-e5c464c130f2?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1650299679684-f2bffb6b76d8?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1697991409803-bdca23da8ef9?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622066737704-c5d990e137fb?fm=jpg&q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1670914131570-61ef0c05e388?fm=jpg&q=80&w=800&auto=format&fit=crop"
];

// Configuration
const TARGET_COUNT = 100;
const BATCH_SIZE = 10;
const DELAY_BETWEEN_IMAGES_MS = 500; // Fast since we have direct URLs
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
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://unsplash.com/'
            }
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
    console.log('🚀 Starting synthetic listing generation (Using Scraped Direct Unsplash URLs)...');

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

            // Select a random image from the DIRECT URLS list
            const randomImageUrl = DIRECT_IMAGE_URLS[Math.floor(Math.random() * DIRECT_IMAGE_URLS.length)];

            // Unique filename based on timestamp and batch
            const filename = `unsplash-${Date.now()}-${i}-${idx}.jpg`;
            const localPath = path.join(IMAGE_DIR, filename);
            const publicPath = `/images/synthetic/${filename}`;

            process.stdout.write(`   ⬇️  Downloading image for "${item.title.substring(0, 15)}..." `);

            const success = await downloadImage(randomImageUrl, localPath);

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
            }

            await sleep(DELAY_BETWEEN_IMAGES_MS);
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

    console.log(`\n🎉 Done! Created ${totalCreated} listings using high-quality Unsplash Scraped Images.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

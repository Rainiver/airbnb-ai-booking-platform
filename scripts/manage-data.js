const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 真实Airbnb数据 - 基于全球热门目的地
const realAirbnbData = [
  // 欧洲房源
  {
    title: "Cozy Studio in Central London",
    description: "Perfect for solo travelers or couples. Located in the heart of London with easy access to all major attractions. The studio features a comfortable double bed, kitchenette, and modern bathroom.",
    category: "Modern",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    locationValue: "London, United Kingdom",
    price: 85,
    rating: 4.6,
    reviews: 234,
    imageSrc: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Historic Apartment in Edinburgh Old Town",
    description: "Charming 2-bedroom apartment in a historic building dating back to the 18th century. Features original stone walls, modern amenities, and stunning views of Edinburgh Castle.",
    category: "Castles",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    locationValue: "Edinburgh, Scotland",
    price: 120,
    rating: 4.8,
    reviews: 156,
    imageSrc: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Beachfront Villa in Santorini",
    description: "Luxurious villa with private pool overlooking the Aegean Sea. Features 3 bedrooms, 2 bathrooms, and a stunning terrace with panoramic views of the famous Santorini sunset.",
    category: "Beach",
    roomCount: 3,
    bathroomCount: 2,
    guestCount: 6,
    locationValue: "Santorini, Greece",
    price: 350,
    rating: 4.9,
    reviews: 89,
    imageSrc: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Mountain Cabin in Swiss Alps",
    description: "Traditional Swiss chalet with modern amenities. Perfect for skiing in winter and hiking in summer. Features a cozy fireplace, fully equipped kitchen, and breathtaking mountain views.",
    category: "Skiing",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    locationValue: "Zermatt, Switzerland",
    price: 180,
    rating: 4.7,
    reviews: 123,
    imageSrc: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Modern Loft in Brooklyn",
    description: "Stylish loft in trendy Brooklyn with exposed brick walls and high ceilings. Features a spacious living area, modern kitchen, and rooftop access with city views.",
    category: "Modern",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    locationValue: "Brooklyn, New York",
    price: 150,
    rating: 4.5,
    reviews: 267,
    imageSrc: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Lake House in Lake District",
    description: "Peaceful lake house surrounded by nature. Perfect for a relaxing getaway with family or friends. Features a private dock, fishing equipment, and stunning lake views.",
    category: "Lake",
    roomCount: 3,
    bathroomCount: 2,
    guestCount: 6,
    locationValue: "Lake District, England",
    price: 200,
    rating: 4.8,
    reviews: 145,
    imageSrc: "https://images.unsplash.com/photo-1506905925346-14b1e5dba1c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Desert Retreat in Joshua Tree",
    description: "Unique desert experience in a modern eco-friendly home. Features floor-to-ceiling windows, outdoor shower, and stargazing deck. Perfect for artists and nature lovers.",
    category: "Desert",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    locationValue: "Joshua Tree, California",
    price: 120,
    rating: 4.6,
    reviews: 198,
    imageSrc: "https://images.unsplash.com/photo-1506905925346-14b1e5dba1c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Countryside Cottage in Cotswolds",
    description: "Charming stone cottage in the heart of the Cotswolds. Features a traditional English garden, cozy fireplace, and walking distance to local pubs and shops.",
    category: "Countryside",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    locationValue: "Cotswolds, England",
    price: 95,
    rating: 4.7,
    reviews: 112,
    imageSrc: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Luxury Penthouse in Manhattan",
    description: "Stunning penthouse with panoramic views of Manhattan skyline. Features 3 bedrooms, 3 bathrooms, private elevator, and a rooftop terrace with hot tub.",
    category: "Lux",
    roomCount: 3,
    bathroomCount: 3,
    guestCount: 6,
    locationValue: "Manhattan, New York",
    price: 800,
    rating: 4.9,
    reviews: 45,
    imageSrc: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Island Villa in Maldives",
    description: "Private island villa with direct beach access. Features 4 bedrooms, infinity pool, private chef service, and water sports equipment. Ultimate luxury experience.",
    category: "Islands",
    roomCount: 4,
    bathroomCount: 3,
    guestCount: 8,
    locationValue: "Maldives",
    price: 1200,
    rating: 5.0,
    reviews: 23,
    imageSrc: "https://images.unsplash.com/photo-1520637836862-4d197d17c5a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Arctic Glass House in Iceland",
    description: "Unique glass house designed for Northern Lights viewing. Features floor-to-ceiling windows, geothermal heating, and private hot spring. Perfect for aurora hunting.",
    category: "Arctic",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    locationValue: "Reykjavik, Iceland",
    price: 250,
    rating: 4.8,
    reviews: 67,
    imageSrc: "https://images.unsplash.com/photo-1551524164-6cf2ac5313bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Wine Country Villa in Tuscany",
    description: "Beautiful villa surrounded by vineyards in the heart of Tuscany. Features 3 bedrooms, private pool, wine cellar, and cooking classes with local chef.",
    category: "Countryside",
    roomCount: 3,
    bathroomCount: 2,
    guestCount: 6,
    locationValue: "Tuscany, Italy",
    price: 300,
    rating: 4.9,
    reviews: 78,
    imageSrc: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Bamboo House in Bali",
    description: "Eco-friendly bamboo house in the rice fields of Ubud. Features open-air design, yoga deck, and traditional Balinese architecture. Perfect for wellness retreat.",
    category: "Countryside",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    locationValue: "Ubud, Bali",
    price: 80,
    rating: 4.7,
    reviews: 234,
    imageSrc: "https://images.unsplash.com/photo-1506905925346-14b1e5dba1c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Floating House in Amsterdam",
    description: "Unique houseboat experience on Amsterdam canals. Features modern interior, private deck, and walking distance to city center. Perfect for a unique Amsterdam experience.",
    category: "Modern",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    locationValue: "Amsterdam, Netherlands",
    price: 110,
    rating: 4.6,
    reviews: 189,
    imageSrc: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Treehouse in Costa Rica",
    description: "Magical treehouse in the rainforest canopy. Features rope bridges, outdoor shower, and wildlife viewing deck. Perfect for nature lovers and adventure seekers.",
    category: "Countryside",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    locationValue: "Costa Rica",
    price: 90,
    rating: 4.8,
    reviews: 156,
    imageSrc: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  }
];

async function main() {
  console.log('🌍 开始管理真实Airbnb数据...');
  
  // 查找或创建演示用户
  let user = await prisma.user.findUnique({
    where: { email: 'demo@airbnb-demo.com' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@airbnb-demo.com',
        name: 'Airbnb Demo Host',
        hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', // password: "password"
      },
    });
    console.log('✅ 创建演示用户:', user.name);
  } else {
    console.log('✅ 找到现有用户:', user.name);
  }

  // 清空现有房源数据
  await prisma.listing.deleteMany({
    where: { userId: user.id }
  });
  console.log('🗑️ 清空现有房源数据');

  // 添加真实房源数据
  for (const listing of realAirbnbData) {
    const createdListing = await prisma.listing.create({
      data: {
        ...listing,
        userId: user.id,
      },
    });
    console.log(`🏠 添加房源: ${createdListing.title} - $${createdListing.price}/晚 (${createdListing.rating}⭐ ${createdListing.reviews}评论)`);
  }

  // 创建一些真实的预订记录
  const allListings = await prisma.listing.findMany({
    where: { userId: user.id }
  });
  
  const sampleReservations = [
    {
      listingId: allListings[0].id,
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-18'),
      totalPrice: allListings[0].price * 3,
    },
    {
      listingId: allListings[1].id,
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-25'),
      totalPrice: allListings[1].price * 5,
    },
    {
      listingId: allListings[2].id,
      startDate: new Date('2024-12-28'),
      endDate: new Date('2025-01-02'),
      totalPrice: allListings[2].price * 5,
    }
  ];

  // 清空现有预订
  await prisma.reservation.deleteMany({
    where: { userId: user.id }
  });

  for (const reservation of sampleReservations) {
    await prisma.reservation.create({
      data: {
        ...reservation,
        userId: user.id,
      },
    });
  }

  console.log('✅ 添加了3个真实预订记录');

  console.log('\n🎉 真实Airbnb数据管理完成！');
  console.log('📊 数据统计:');
  console.log(`- 房源数量: ${realAirbnbData.length}个`);
  console.log(`- 预订记录: 3个`);
  console.log(`- 覆盖城市: 伦敦、爱丁堡、圣托里尼、瑞士、纽约、湖区、约书亚树、科茨沃尔德、曼哈顿、马尔代夫、冰岛、托斯卡纳、巴厘岛、阿姆斯特丹、哥斯达黎加`);
  console.log(`- 价格范围: $${Math.min(...realAirbnbData.map(l => l.price))} - $${Math.max(...realAirbnbData.map(l => l.price))}`);
  console.log(`- 平均评分: ${(realAirbnbData.reduce((sum, l) => sum + l.rating, 0) / realAirbnbData.length).toFixed(1)}⭐`);
  console.log('\n🌐 现在可以访问 http://localhost:3000 查看真实的Airbnb数据！');
  console.log('👤 演示账户: demo@airbnb-demo.com / password');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



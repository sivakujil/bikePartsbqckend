import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Product from "./Models/Product.js";
import User from "./Models/User.js";

dotenv.config();

const createSampleUsers = async () => {
  const passwordHash = await bcrypt.hash("password", 10);
  
  return [
    {
      name: "Admin",
      email: "admin@bikeparts.com",
      passwordHash,
      role: "admin"
    },
    {
      name: "John Doe",
      email: "john@example.com",
      passwordHash,
      role: "user"
    },
    {
      name: "Rider One",
      email: "rider@bikeparts.com",
      passwordHash,
      role: "rider",
      phone: "+1234567890",
      vehicleType: "motorcycle",
      vehicleNumber: "MC-12345",
      isOnline: false,
      rating: 4.5
    },
  ];
};

const sampleProducts = [
  {
    name: "Yamaha YZF-R6 Brake Pads",
    sku: "BRA-YAM-YZFR6-001",
    category: "Brakes",
    brand: "Yamaha",
    model: "YZF-R6",
    price: 45.99,
    cost: 25.00,
    quantity: 50,
    image: "https://picsum.photos/300/300?random=1",
    description: "High-quality brake pads for Yamaha YZF-R6",
    specifications: {
      material: "Ceramic",
      compatibility: "YZF-R6 2008-2023",
      weight: "0.5kg"
    },
    rating: 4.5,
    reviews: 12
  },
  {
    name: "Honda CBR1000RR Oil Filter",
    sku: "ENG-HON-CBR1000-002",
    category: "Engine",
    brand: "Honda",
    model: "CBR1000RR",
    price: 12.99,
    cost: 6.50,
    quantity: 100,
    image: "https://picsum.photos/300/300?random=2",
    description: "OEM oil filter for Honda CBR1000RR",
    specifications: {
      type: "Spin-on",
      compatibility: "CBR1000RR 2008-2023",
      weight: "0.2kg"
    },
    rating: 4.8,
    reviews: 25
  },
  {
    name: "Kawasaki Ninja ZX-10R Chain",
    sku: "DRV-KAW-ZX10R-003",
    category: "Drivetrain",
    brand: "Kawasaki",
    model: "Ninja ZX-10R",
    price: 89.99,
    cost: 45.00,
    quantity: 30,
    image: "https://picsum.photos/300/300?random=3",
    description: "Heavy-duty chain for Kawasaki Ninja ZX-10R",
    specifications: {
      type: "O-ring",
      links: 120,
      compatibility: "ZX-10R 2011-2023",
      weight: "2.5kg"
    },
    rating: 4.6,
    reviews: 18
  },
  {
    name: "Suzuki GSX-R750 Front Tire",
    sku: "TIR-SUZ-GSXR750-004",
    category: "Tires",
    brand: "Suzuki",
    model: "GSX-R750",
    price: 159.99,
    cost: 80.00,
    quantity: 20,
    image: "https://picsum.photos/300/300?random=4",
    description: "Sport performance front tire for Suzuki GSX-R750",
    specifications: {
      size: "120/70ZR17",
      type: "Radial",
      compatibility: "GSX-R750 2008-2023",
      weight: "4.5kg"
    },
    rating: 4.7,
    reviews: 22
  },
  {
    name: "Ducati Panigale V4 Clutch Lever",
    sku: "CTL-DUC-PANV4-005",
    category: "Controls",
    brand: "Ducati",
    model: "Panigale V4",
    price: 34.99,
    cost: 17.50,
    quantity: 40,
    image: "https://picsum.photos/300/300?random=5",
    description: "Aluminum clutch lever for Ducati Panigale V4",
    specifications: {
      material: "Aluminum",
      color: "Red",
      compatibility: "Panigale V4 2018-2023",
      weight: "0.1kg"
    },
    rating: 4.4,
    reviews: 15
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Product.deleteMany();
    await User.deleteMany();

    const sampleUsers = await createSampleUsers();
    await User.insertMany(sampleUsers);
    await Product.insertMany(sampleProducts);

    console.log("✅ Database seeded successfully!");
    console.log("📝 Test users created with password: 'password'");
    console.log("👤 Admin: admin@bikeparts.com");
    console.log("👤 User: john@example.com");
    console.log("👤 Rider: rider@bikeparts.com");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedDatabase();

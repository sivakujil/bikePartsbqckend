#!/usr/bin/env node

/**
 * Backend Health Check Script
 * Run this to verify all backend components are working
 */

console.log("🔍 Backend Health Check Started...\n");

// Check 1: Verify imports
console.log("✓ Checking imports...");
try {
  import("express").then(() => console.log("  ✓ express imported"));
  import("mongoose").then(() => console.log("  ✓ mongoose imported"));
  import("dotenv").then(() => console.log("  ✓ dotenv imported"));
  import("cors").then(() => console.log("  ✓ cors imported"));
} catch (err) {
  console.error("✗ Import Error:", err.message);
}

// Check 2: Verify environment
console.log("\n✓ Checking environment...");
const env = process.env.NODE_ENV || "development";
console.log(`  ✓ Environment: ${env}`);
console.log(`  ✓ Node version: ${process.version}`);
console.log(`  ✓ Port: ${process.env.PORT || 5000}`);

// Check 3: Database URL
console.log("\n✓ Checking database configuration...");
if (process.env.MONGO_URI) {
  console.log("  ✓ MONGO_URI configured");
} else {
  console.log("  ⚠ MONGO_URI not found in .env");
}

// Check 4: JWT Secret
console.log("\n✓ Checking JWT configuration...");
if (process.env.JWT_SECRET) {
  console.log("  ✓ JWT_SECRET configured");
} else {
  console.log("  ⚠ JWT_SECRET not found in .env");
}

// Check 5: File structure
console.log("\n✓ Checking file structure...");
import("fs").then(({ default: fs }) => {
  const files = [
    "./src/server.js",
    "./src/controllers/cartOrderController.js",
    "./src/routes/cartOrderRoutes.js",
    "./src/Models/cart.js",
    "./src/Models/order.js",
    "./src/Models/Product.js",
    "./src/middlewares/authmiddleware.js"
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ✗ ${file} - NOT FOUND`);
    }
  });

  console.log("\n✓ Health check complete!");
  console.log("\n📝 Next steps:");
  console.log("  1. Ensure .env file has MONGO_URI and JWT_SECRET");
  console.log("  2. Run: npm install");
  console.log("  3. Run: npm start");
  console.log("  4. Check http://localhost:5000/api/products");
});

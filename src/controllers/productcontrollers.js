
// import Product from "../Models/Product.js";

// // ================================
// // GET ALL PRODUCTS (Filters + Search + Pagination)
// // ================================
// export const getProducts = async (req, res) => {
//   try {
//     const filter = { isActive: true };

//     // Price Filter
//     const minPrice = parseFloat(req.query.minPrice);
//     const maxPrice = parseFloat(req.query.maxPrice);
//     if (!isNaN(minPrice) || !isNaN(maxPrice)) {
//       filter.price = {};
//       if (!isNaN(minPrice)) filter.price.$gte = minPrice;
//       if (!isNaN(maxPrice)) filter.price.$lte = maxPrice;
//     }

//     // Category & Brand Filter
//     if (req.query.category)
//       filter.category = { $regex: req.query.category, $options: "i" };

//     if (req.query.brand)
//       filter.brand = { $regex: req.query.brand, $options: "i" };

//     // Rating Filter
//     const minRating = parseFloat(req.query.minRating);
//     if (!isNaN(minRating)) filter.rating = { $gte: minRating };

//     // In Stock
//     if (req.query.inStock === "true") filter.quantity = { $gt: 0 };

//     // Search Filter
//     if (req.query.search) {
//       const regex = { $regex: req.query.search, $options: "i" };
//       filter.$or = [
//         { name: regex },
//         { description: regex },
//         { brand: regex },
//         { category: regex },
//         { tags: regex }
//       ];
//     }

//     // Sorting
//     let sortOption = {};
//     switch (req.query.sort) {
//       case "price-low":
//         sortOption = { price: 1 };
//         break;
//       case "price-high":
//         sortOption = { price: -1 };
//         break;
//       case "rating":
//         sortOption = { rating: -1 };
//         break;
//       case "name":
//         sortOption = { name: 1 };
//         break;
//       case "newest":
//       default:
//         sortOption = { createdAt: -1 };
//     }

//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const products = await Product.find(filter)
//       .sort(sortOption)
//       .skip(skip)
//       .limit(limit);

//     const total = await Product.countDocuments(filter);

//     res.json({
//       products,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ================================
// // GET SINGLE PRODUCT
// // ================================
// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product)
//       return res.status(404).json({ message: "Product not found" });

//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ================================
// // CREATE PRODUCT (ADMIN)
// export const createProduct = async (req, res) => {
//   try {
//     const product = await Product.create(req.body);
//     res.status(201).json(product);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateProduct = async (req, res) => {
//   try {
//     const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const deleteProduct = async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.json({ message: "Product deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ================================
// // UPDATE PRODUCT STOCK (ADMIN)
// export const updateProductStock = async (req, res) => {
//   try {
//     const { quantity, reason, type } = req.body;

//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Update quantity
//     product.quantity += quantity;

//     // Add to stock history
//     product.stockHistory.push({
//       type: type || "adjustment",
//       quantity,
//       reason,
//       updatedBy: req.user?.id // Assuming auth middleware adds user
//     });

//     await product.save();

//     res.json({
//       message: "Stock updated successfully",
//       product
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




import Product from "../Models/Product.js";

// ======================================
// GET ALL PRODUCTS (Filters + Search + Pagination)
// ======================================
export const getProducts = async (req, res) => {
  try {
    const filter = { isActive: true };

    // Price Filter
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      filter.price = {};
      if (!isNaN(minPrice)) filter.price.$gte = minPrice;
      if (!isNaN(maxPrice)) filter.price.$lte = maxPrice;
    }

    // Category Filter
    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: "i" };
    }

    // Brand Filter
    if (req.query.brand) {
      filter.brand = { $regex: req.query.brand, $options: "i" };
    }

    // Rating Filter
    const minRating = parseFloat(req.query.minRating);
    if (!isNaN(minRating)) {
      filter.rating = { $gte: minRating };
    }

    // In Stock Only
    if (req.query.inStock === "true") {
      filter.quantity = { $gt: 0 };
    }

    // Search Filter
    if (req.query.search) {
      const regex = { $regex: req.query.search, $options: "i" };

      filter.$or = [
        { name: regex },
        { description: regex },
        { brand: regex },
        { category: regex },
        { tags: regex }
      ];
    }

    // Sorting
    let sortOption = {};
    switch (req.query.sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "name":
        sortOption = { name: 1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Query
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================
// GET SINGLE PRODUCT
// ======================================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================================
// CREATE PRODUCT (ADMIN)
// ======================================
export const createProduct = async (req, res) => {
  try {
    const { name, sku, category, brand, model, price, discountPrice, discountPercentage, cost, quantity, description, image, images } = req.body;

    // Validation
    if (!name || !category || !brand || !price || !cost || !quantity) {
      return res.status(400).json({ 
        message: "Missing required fields: name, category, brand, price, cost, quantity are required" 
      });
    }

    // Generate SKU if not provided
    let generatedSku = sku;
    if (!generatedSku) {
      const categoryCode = category.trim().substring(0, 3).toUpperCase();
      const brandCode = brand.trim().substring(0, 3).toUpperCase();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      generatedSku = `${categoryCode}-${brandCode}-${randomNum}`;
    }

    // Prepare product data
    const productData = {
      name: name.trim(),
      sku: generatedSku.trim(),
      category: category.trim(),
      brand: brand.trim(),
      model: model ? model.trim() : undefined,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      discountPercentage: discountPercentage ? parseFloat(discountPercentage) : undefined,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      description: description ? description.trim() : undefined,
      image: image ? image.trim() : undefined,
      images: images ? (Array.isArray(images) ? images : [images]) : [],
      isActive: true
    };

    const product = await Product.create(productData);
    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// UPDATE PRODUCT (ADMIN)
// ======================================
export const updateProduct = async (req, res) => {
  try {
    const { name, category, brand, model, price, discountPrice, discountPercentage, cost, quantity, description, image, images } = req.body;

    // Validation
    if (name && name.trim() === '') {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    if (category && category.trim() === '') {
      return res.status(400).json({ message: "Category cannot be empty" });
    }
    if (brand && brand.trim() === '') {
      return res.status(400).json({ message: "Brand cannot be empty" });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (brand !== undefined) updateData.brand = brand.trim();
    if (model !== undefined) updateData.model = model ? model.trim() : undefined;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage ? parseFloat(discountPercentage) : undefined;
    if (cost !== undefined) updateData.cost = parseFloat(cost);
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (description !== undefined) updateData.description = description ? description.trim() : undefined;
    if (image !== undefined) updateData.image = image ? image.trim() : undefined;
    if (images !== undefined) {
      updateData.images = images ? (Array.isArray(images) ? images : [images]) : [];
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Product not found" });

    res.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// DELETE PRODUCT (ADMIN)
// ======================================
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


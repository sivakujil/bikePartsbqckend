import ProductRequest from "../Models/ProductRequest.js";
import Product from "../Models/Product.js";
import mongoose from "mongoose";

// Create a new product request
export const createProductRequest = async (req, res) => {
  try {
    console.log('POST /api/product-requests body:', req.body);
    console.log('Authenticated user id:', req.user?.id);

    const { productId, description } = req.body;
    const userId = req.user.id; // From JWT

    // Validate and set product name
    let finalProductName;
    if (productId) {
      // Existing product request
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.log('Validation failed: productId is not a valid ObjectId:', productId);
        return res.status(400).json({
          message: "Valid productId is required"
        });
      }

      // Fetch product to get name
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      finalProductName = product.name;
    } else {
      // New product request
      if (!productName || !productName.trim()) {
        console.log('Validation failed: productName is missing or empty');
        return res.status(400).json({
          message: "Product name is required for new product requests"
        });
      }

      finalProductName = productName.trim();
    }

    // Create the request
    const productRequest = await ProductRequest.create({
      userId,
      productId: productId || null,
      productName: finalProductName,
      description: description ? description.trim() : "",
    });

    // Populate user info
    await productRequest.populate('userId', 'name email');

    res.status(201).json({
      message: "Request sent to admin",
      request: productRequest
    });
  } catch (err) {
    console.error("Error creating product request:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all product requests (for admin)
export const getAllProductRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    let filter = {};
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get requests with pagination
    const requests = await ProductRequest.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await ProductRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Error fetching product requests:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get product requests for the logged-in user
export const getUserProductRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await ProductRequest.find({ userId })
      .populate('productId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      requests
    });
  } catch (err) {
    console.error("Error fetching user product requests:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update product request status (for admin)
export const updateProductRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["pending", "seen", "replied"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: pending, seen, replied"
      });
    }

    const request = await ProductRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.json({
      message: "Product request status updated successfully",
      request
    });
  } catch (err) {
    console.error("Error updating product request status:", err);
    res.status(500).json({ message: err.message });
  }
};

// Reply to product request (for admin)
export const replyToProductRequest = async (req, res) => {
  try {
    const { adminReply, estimatedDate } = req.body;
    const { id } = req.params;

    const updateData = {
      status: "replied",
    };

    if (adminReply !== undefined) {
      updateData.adminReply = adminReply.trim();
    }

    if (estimatedDate !== undefined) {
      updateData.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;
    }

    const request = await ProductRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'name email').populate('productId', 'name');

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.json({
      message: "Reply sent successfully",
      request
    });
  } catch (err) {
    console.error("Error replying to product request:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete product request (for admin)
export const deleteProductRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ProductRequest.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.json({ message: "Product request deleted successfully" });
  } catch (err) {
    console.error("Error deleting product request:", err);
    res.status(500).json({ message: err.message });
  }
};
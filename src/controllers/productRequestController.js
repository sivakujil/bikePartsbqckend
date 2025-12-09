import ProductRequest from "../Models/ProductRequest.js";

// Create a new product request
export const createProductRequest = async (req, res) => {
  try {
    const { productName, description, userId } = req.body;

    // Validate required fields
    if (!productName || !description) {
      return res.status(400).json({
        message: "Product name and description are required"
      });
    }

    // Create the request
    const productRequest = await ProductRequest.create({
      productName: productName.trim(),
      description: description.trim(),
      userId: userId || null, // Optional user ID
    });

    // Populate user info if userId is provided
    await productRequest.populate('userId', 'name email');

    res.status(201).json({
      message: "Product request submitted successfully",
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

// Update product request status (for admin)
export const updateProductRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["pending", "reviewed", "fulfilled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: pending, reviewed, fulfilled"
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
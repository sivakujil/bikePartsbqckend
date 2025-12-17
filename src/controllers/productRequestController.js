import ProductRequest from "../Models/ProductRequest.js";

// Create a new product request
export const createProductRequest = async (req, res) => {
  try {
    const { productName, message, userId } = req.body;

    // Validate required fields
    if (!productName || !message) {
      return res.status(400).json({
        message: "Product name and message are required"
      });
    }

    // Create the request
    const productRequest = await ProductRequest.create({
      productName: productName.trim(),
      message: message.trim(),
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

// Get product requests for the logged-in user
export const getUserProductRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming req.user is set by auth middleware

    const requests = await ProductRequest.find({ userId })
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
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: pending, approved, rejected"
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
    const { status, replyMessage } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: pending, approved, rejected"
      });
    }

    // Validate replyMessage
    if (!replyMessage || replyMessage.trim().length === 0) {
      return res.status(400).json({
        message: "Reply message is required"
      });
    }

    const request = await ProductRequest.findByIdAndUpdate(
      id,
      {
        status,
        replyMessage: replyMessage.trim(),
        repliedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.json({
      message: "Product request replied successfully",
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
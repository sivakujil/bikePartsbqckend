// import express from "express";
// import { getCart, addToCart, removeFromCart, updateCartItem } from "../controllers/cartcontroller.js";
// import { protect } from "../middlewares/authmiddleware.js";

// const router = express.Router();

// router.get("/", protect, getCart);
// router.post("/add", protect, addToCart);
// router.post("/remove", protect, removeFromCart);
// router.post("/update", protect, updateCartItem);

// export default router;


import express from "express";
import Cart from "../Models/cart.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

// GET /api/cart
router.get("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) return res.json({ items: [] });
    res.json({ items: cart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cart" });
  }
});

// POST /api/cart/add
router.post("/add", protect, async (req, res) => {
  const { productId, quantity, price } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price });
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    res.json({ items: populatedCart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add item" });
  }
});

// POST /api/cart/remove
router.post("/remove", protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    res.json({ items: populatedCart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// POST /api/cart/update
router.post("/update", protect, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    res.json({ items: populatedCart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update item" });
  }
});

// POST /api/cart/clear
router.post("/clear", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.json({ items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

export default router;

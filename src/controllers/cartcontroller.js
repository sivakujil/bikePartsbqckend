import Cart from "../Models/cart.js";

// GET USER CART
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id }).populate("products.product_id");
    if (!cart) {
      cart = await Cart.create({ user_id: req.user._id, products: [] });
    }
    
    // Transform the data to match frontend expectations
    const transformedCart = {
      items: cart.products.map(item => ({
        productId: item.product_id._id,
        name: item.product_id.name,
        price: item.product_id.price,
        image: item.product_id.image,
        quantity: item.quantity
      }))
    };
    
    res.json(transformedCart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ADD/UPDATE ITEM
export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user_id: req.user._id, products: [] });
    }

    const index = cart.products.findIndex(p => p.product_id.toString() === productId);
    if (index >= 0) {
      cart.products[index].quantity += quantity;
    } else {
      cart.products.push({ product_id: productId, quantity });
    }

    await cart.save();
    
    // Return updated cart in expected format
    const updatedCart = await Cart.findOne({ user_id: req.user._id }).populate("products.product_id");
    const transformedCart = {
      items: updatedCart.products.map(item => ({
        productId: item.product_id._id,
        name: item.product_id.name,
        price: item.product_id.price,
        image: item.product_id.image,
        quantity: item.quantity
      }))
    };
    
    res.json(transformedCart);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: err.message });
  }
};

// REMOVE ITEM
export const removeFromCart = async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(p => p.product_id.toString() !== productId);
    await cart.save();
    
    // Return updated cart in expected format
    const updatedCart = await Cart.findOne({ user_id: req.user._id }).populate("products.product_id");
    const transformedCart = {
      items: updatedCart.products.map(item => ({
        productId: item.product_id._id,
        name: item.product_id.name,
        price: item.product_id.price,
        image: item.product_id.image,
        quantity: item.quantity
      }))
    };
    
    res.json(transformedCart);
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ITEM QUANTITY
export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = cart.products.findIndex(p => p.product_id.toString() === productId);
    if (index >= 0) {
      cart.products[index].quantity = quantity;
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    await cart.save();
    
    // Return updated cart in expected format
    const updatedCart = await Cart.findOne({ user_id: req.user._id }).populate("products.product_id");
    const transformedCart = {
      items: updatedCart.products.map(item => ({
        productId: item.product_id._id,
        name: item.product_id.name,
        price: item.product_id.price,
        image: item.product_id.image,
        quantity: item.quantity
      }))
    };
    
    res.json(transformedCart);
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ message: err.message });
  }
};

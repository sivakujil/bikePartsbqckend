import User from "../Models/User.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return process.env.JWT_SECRET;
};

// Google OAuth
export const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.CLIENT_URL}/login`
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const { id: googleId, email, name, picture } = userResponse.data;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        role: "user",
        profilePicture: picture
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        profilePicture: user.profilePicture
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// Facebook OAuth
export const facebookAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code,
        redirect_uri: `${process.env.CLIENT_URL}/login`
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Facebook
    const userResponse = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'id,name,email,picture',
        access_token
      }
    });

    const { id: facebookId, email, name, picture } = userResponse.data;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { facebookId }] });

    if (user) {
      // Update Facebook ID if not set
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        facebookId,
        role: "user",
        profilePicture: picture?.data?.url
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        profilePicture: user.profilePicture
      },
    });
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    res.status(500).json({ message: "Facebook authentication failed" });
  }
};

// Get OAuth URLs for frontend
export const getOAuthUrls = (req, res) => {
  try {
    // Check if OAuth credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
      return res.status(500).json({
        message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file"
      });
    }

    if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID === 'your_facebook_app_id_here') {
      return res.status(500).json({
        message: "Facebook OAuth not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env file"
      });
    }

    const googleUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.CLIENT_URL}/auth/google/callback`)}&scope=email%20profile&response_type=code&access_type=offline&prompt=consent&state=google`;

    const facebookUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(`${process.env.CLIENT_URL}/auth/facebook/callback`)}&scope=email,public_profile&state=facebook`;

    res.json({
      google: googleUrl,
      facebook: facebookUrl
    });
  } catch (error) {
    console.error("Get OAuth URLs error:", error);
    res.status(500).json({ message: "Failed to generate OAuth URLs" });
  }
};
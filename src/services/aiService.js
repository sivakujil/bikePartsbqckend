import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Bike parts knowledge base
const BIKE_PARTS_KNOWLEDGE = `
You are a helpful AI assistant for a bike parts e-commerce store. You help customers with:

1. **Product Information**: Provide details about bike parts, compatibility, specifications
2. **Recommendations**: Suggest parts based on bike type, riding style, budget
3. **Technical Support**: Answer questions about installation, maintenance, troubleshooting
4. **Order Assistance**: Help with order status, shipping, returns
5. **General Advice**: Bike maintenance tips, safety guidelines, riding tips

**Available Categories:**
- Engine Parts (pistons, cylinders, valves, crankshafts)
- Brake System (disc brakes, brake pads, calipers, rotors)
- Suspension (forks, shocks, linkages)
- Transmission (chains, sprockets, gearboxes)
- Electrical (batteries, starters, alternators, wiring)
- Body Parts (fairings, seats, tanks, fenders)
- Wheels & Tires (rims, spokes, hubs, tires)
- Exhaust System (pipes, mufflers, catalytic converters)
- Cooling System (radiators, fans, thermostats)
- Accessories (lights, mirrors, locks, stands)

**Popular Brands:** Yamaha, Honda, Suzuki, Kawasaki, Ducati, BMW, KTM, Harley-Davidson

**Price Range:** Parts range from ₹500 to ₹50,000 depending on type and brand.

IMPORTANT: Always respond in plain text only. Do not include any HTML, images, links, or formatted content. Do not show product images or visual elements. Keep responses text-based and helpful. Encourage customers to browse our catalog or contact support for specific needs.
`;

export const generateAIResponse = async (userMessage, conversationHistory = []) => {
  try {
    if (!genAI) {
      return "AI service is not configured. Please contact support.";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build conversation history for context
    let conversationText = BIKE_PARTS_KNOWLEDGE + '\n\n';
    
    // Add recent conversation history (last 10 messages)
    conversationHistory.slice(-10).forEach(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      conversationText += `${role}: ${msg.text}\n`;
    });
    
    conversationText += `User: ${userMessage}\nAssistant:`;

    const result = await model.generateContent(conversationText);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support team.";
  }
};

export const getBikePartsSuggestions = async (query) => {
  try {
    if (!genAI) {
      return [];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `${BIKE_PARTS_KNOWLEDGE}

Based on the user's query: "${query}", suggest relevant bike parts from our catalog. Return a JSON array of suggestions with name, category, and brief description. Format exactly like this:
[
  {"name": "Part Name", "category": "Category", "description": "Brief description"},
  {"name": "Another Part", "category": "Category", "description": "Brief description"}
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return [];
    }
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return [];
  }
};

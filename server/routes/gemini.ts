import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI - Try multiple API keys or use environment variable
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAcbI5FORAoEJ9VByDP_ssIvHq3zmv-Ai4";
const genAI = new GoogleGenerativeAI(API_KEY);

interface TravelPlanRequest {
  city: string;
  days: number;
  budgetCategory: string;
  currency: string;
  travelStyles: string[];
}

interface TravelPlanResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const generateTravelItinerary: RequestHandler = async (req, res) => {
  console.log("Received request:", req.body);
  const { city, days, budgetCategory, currency, travelStyles }: TravelPlanRequest = req.body;

  if (!city || !days || !budgetCategory || !currency || !travelStyles || !Array.isArray(travelStyles) || travelStyles.length === 0) {
    console.log("Missing required fields:", { city, days, budgetCategory, currency, travelStyles });
    return res.status(400).json({
      success: false,
      error: "Missing required fields: city, days, budgetCategory, currency, travelStyles (must be non-empty array)"
    });
  }

  console.log("Generating itinerary for:", { city, days, budgetCategory, currency, travelStyles });

  try {

    // Create the prompt for Gemini
    const travelStyleDescriptions = {
      adventure: "Focus on outdoor activities, hiking, extreme sports, nature exploration, and adrenaline-pumping experiences",
      culture: "Emphasize museums, historical sites, local traditions, art galleries, monuments, and cultural immersion",
      foodie: "Prioritize local cuisine, food tours, cooking classes, markets, street food, and culinary experiences",
      shopping: "Include local markets, boutiques, shopping districts, artisan crafts, and unique shopping experiences",
      relaxation: "Focus on spas, beaches, parks, leisurely activities, wellness experiences, and peaceful retreats",
      mixed: "Provide a balanced combination of all travel experiences including culture, food, adventure, shopping, and relaxation"
    };
    
    // Combine descriptions for multiple travel styles
    const styleDescriptions = travelStyles.map(style => {
      const desc = travelStyleDescriptions[style as keyof typeof travelStyleDescriptions] || travelStyleDescriptions.mixed;
      return `${style.toUpperCase()}: ${desc}`;
    }).join('\n');
    
    const prompt = `Create a detailed ${days}-day travel itinerary for ${city} with a ${budgetCategory} budget in ${currency}.

TRAVEL STYLES: ${travelStyles.map(s => s.toUpperCase()).join(', ')}
Style Focus:
${styleDescriptions}

Please tailor all activities, dining, and experiences to incorporate elements from ALL selected travel styles: ${travelStyles.join(', ')}. Create a balanced itinerary that reflects these combined preferences throughout each day.

Please provide a JSON response with the following structure:
{
  "city": "${city}",
  "days": ${days},
  "budget": [calculated total budget],
  "currency": "${currency}",
  "dailyItinerary": [
    {
      "day": 1,
      "theme": "Day theme",
      "summary": "Day summary",
      "activities": {
        "morning": [
          {
            "name": "Activity name",
            "description": "Activity description",
            "duration": "2 hours",
            "cost": 25,
            "type": "attraction"
          }
        ],
        "afternoon": [...],
        "evening": [...]
      },
      "dining": {
        "breakfast": {
          "name": "Restaurant name",
          "cuisine": "Cuisine type",
          "priceRange": "$10-15",
          "estimatedCost": 12,
          "description": "Restaurant description"
        },
        "lunch": {...},
        "dinner": {...}
      },
      "navigation": "Navigation tips",
      "optionalActivities": [...],
      "estimatedCost": 120
    }
  ]
}

Make sure the activities are realistic for ${city}, consider the ${budgetCategory} budget level, and MOST IMPORTANTLY, tailor all experiences to incorporate elements from ALL selected travel styles: ${travelStyles.join(', ')}. The itinerary should reflect the combined preferences while maintaining variety and balance. Keep costs reasonable for the budget category.`;

    console.log("Calling Gemini API...");
    
    // Generate content using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Model created, generating content...");
    
    const result = await model.generateContent(prompt);
    console.log("Content generated, getting response...");
    
    const response = await result.response;
    console.log("Response received, extracting text...");
    
    const text = response.text();
    console.log("Raw Gemini response:", text.substring(0, 200) + "...");

    // Try to parse the JSON response
    let travelPlan;
    try {
      // Extract JSON from the response (Gemini might wrap it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        travelPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return res.status(500).json({
        success: false,
        error: "Failed to parse AI response"
      });
    }

    res.json({
      success: true,
      data: travelPlan
    });

  } catch (error) {
    console.error("Gemini API error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Use enhanced mock data as fallback
    console.log("Using enhanced mock data as fallback...");
    const mockItinerary = generateRealisticMockItinerary(city, days, budgetCategory, currency, travelStyles);
    
    res.json({
      success: true,
      data: mockItinerary,
      note: "Generated using enhanced mock data (AI service unavailable)"
    });
  }
};

// Test endpoint to verify Gemini API is working
export const testGeminiAPI: RequestHandler = async (req, res) => {
  try {
    console.log("Testing Gemini API connection...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say 'Hello, Gemini is working!' in one sentence.");
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini test response:", text);
    
    res.json({
      success: true,
      message: "Gemini API is working!",
      response: text
    });
    
  } catch (error) {
    console.error("Gemini test failed:", error);
    
    // Return a mock response for testing
    res.json({
      success: true,
      message: "Using mock response (Gemini API failed)",
      response: "Hello, this is a mock response because Gemini API is not working."
    });
  }
};

// Enhanced mock data generator that creates realistic AI-like responses
const generateRealisticMockItinerary = (city: string, days: number, budgetCategory: string, currency: string, travelStyles: string[]) => {
  const budgetRanges = {
    budget: { daily: 50, total: 50 * days },
    "mid-range": { daily: 120, total: 120 * days },
    luxury: { daily: 300, total: 300 * days },
    "ultra-luxury": { daily: 500, total: 500 * days }
  };

  const budget = budgetRanges[budgetCategory as keyof typeof budgetRanges] || budgetRanges["mid-range"];

  // Generate city-specific data based on the actual city input
  const generateCityData = (cityName: string) => {
    const cityLower = cityName.toLowerCase();
    
    // City-specific data mapping with travel style variations
    const cityMappings: { [key: string]: any } = {
      "agra": {
        culture: {
          attractions: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh", "Itimad-ud-Daulah"],
          activities: ["Heritage Walk", "Mughal Architecture Tour", "Historical Museum Visit"]
        },
        shopping: {
          attractions: ["Sadar Bazaar", "Kinari Bazaar", "Raja Ki Mandi", "Taj Ganj Market", "Subhash Bazaar"],
          activities: ["Marble Inlay Shopping", "Leather Goods Market", "Handicraft Shopping", "Carpet Shopping", "Jewelry Market Visit"]
        },
        foodie: {
          attractions: ["Chaat Gali", "Deori Road Food Street", "Sadar Bazaar Food Market", "Taj Ganj Eateries", "Local Sweet Shops"],
          activities: ["Street Food Tour", "Petha Tasting", "Mughlai Cuisine Experience", "Local Sweets Shopping"]
        },
        adventure: {
          attractions: ["Yamuna River", "Chambal Safari", "Keoladeo National Park", "Bharatpur Bird Sanctuary", "Cycling Tours"],
          activities: ["River Boating", "Wildlife Safari", "Bird Watching", "Heritage Cycling", "Photography Walk"]
        },
        relaxation: {
          attractions: ["Mehtab Bagh Gardens", "Ram Bagh", "Soami Bagh", "Taj Nature Walk", "Spa Resorts"],
          activities: ["Garden Stroll", "Sunset Viewing", "Spa Treatment", "Meditation Session", "Nature Photography"]
        },
        mixed: {
          attractions: ["Taj Mahal", "Sadar Bazaar", "Agra Fort", "Kinari Bazaar", "Mehtab Bagh"],
          activities: ["Heritage Tour", "Shopping Experience", "Cultural Walk", "Local Market Visit", "Garden Visit"]
        },
        restaurants: ["Pinch of Spice", "Dasaprakash", "Joney's Place", "Shankara Vegis Restaurant", "The Charcoal Chimney"],
        neighborhoods: ["Taj Ganj", "Sadar Bazaar", "Civil Lines", "Kamla Nagar", "Dayalbagh"]
      },
      "paris": {
        culture: {
          attractions: ["Louvre Museum", "Notre-Dame Cathedral", "Arc de Triomphe", "Musée d'Orsay", "Sainte-Chapelle"],
          activities: ["Museum Tour", "Historical Walk", "Art Gallery Visit", "Architecture Tour"]
        },
        shopping: {
          attractions: ["Champs-Élysées", "Galeries Lafayette", "Le Marais Boutiques", "Rue de Rivoli", "Montmartre Artists Market"],
          activities: ["Fashion Shopping", "Luxury Boutiques", "Vintage Shopping", "Art Market Browse", "Designer Stores"]
        },
        foodie: {
          attractions: ["Marché des Enfants Rouges", "Latin Quarter Bistros", "Montmartre Cafes", "Seine Riverside Restaurants", "Local Patisseries"],
          activities: ["Food Market Tour", "Wine Tasting", "Cooking Class", "Pastry Workshop", "Bistro Hopping"]
        },
        adventure: {
          attractions: ["Seine River Cruise", "Eiffel Tower Climb", "Montmartre Hiking", "Bike Tours", "Catacombs Exploration"],
          activities: ["River Adventure", "Tower Climbing", "City Cycling", "Underground Exploration", "Walking Tours"]
        },
        relaxation: {
          attractions: ["Luxembourg Gardens", "Tuileries Garden", "Seine Riverbanks", "Spa Centers", "Park Benches"],
          activities: ["Garden Stroll", "Picnic in Park", "Riverside Walk", "Spa Treatment", "Café Sitting"]
        },
        mixed: {
          attractions: ["Eiffel Tower", "Louvre Museum", "Champs-Élysées", "Montmartre", "Seine River"],
          activities: ["Sightseeing Tour", "Cultural Visit", "Shopping Walk", "Dining Experience", "City Exploration"]
        },
        restaurants: ["Le Comptoir du Relais", "L'Arpège", "Le Jules Verne", "Le Chateaubriand", "Septime"],
        neighborhoods: ["Le Marais", "Montmartre", "Saint-Germain-des-Prés", "Latin Quarter", "Champs-Élysées"]
      },
      "tokyo": {
        culture: {
          attractions: ["Senso-ji Temple", "Meiji Shrine", "Tokyo National Museum", "Imperial Palace", "Ueno Park"],
          activities: ["Temple Visit", "Traditional Garden Walk", "Museum Tour", "Cultural District Exploration"]
        },
        shopping: {
          attractions: ["Shibuya Crossing", "Harajuku Takeshita Street", "Ginza District", "Akihabara Electronics", "Ameya-Yokocho Market"],
          activities: ["Fashion Shopping", "Electronics Shopping", "Anime Merchandise", "Traditional Crafts", "Street Fashion"]
        },
        foodie: {
          attractions: ["Tsukiji Outer Market", "Ramen Yokocho", "Izakaya District", "Sushi Restaurants", "Street Food Stalls"],
          activities: ["Sushi Tasting", "Ramen Tour", "Street Food Experience", "Sake Tasting", "Cooking Class"]
        },
        adventure: {
          attractions: ["Tokyo Skytree", "Mount Fuji Day Trip", "Tokyo Bay Cruise", "Cycling Tours", "Robot Restaurant"],
          activities: ["Sky Tower Climb", "Mountain Hiking", "Bay Cruise", "City Cycling", "Unique Experiences"]
        },
        relaxation: {
          attractions: ["Shinjuku Gyoen", "Ueno Park", "Traditional Onsen", "Zen Gardens", "Tea Houses"],
          activities: ["Garden Stroll", "Hot Spring Bath", "Tea Ceremony", "Meditation", "Park Relaxation"]
        },
        mixed: {
          attractions: ["Tokyo Skytree", "Shibuya Crossing", "Senso-ji Temple", "Ginza District", "Ueno Park"],
          activities: ["City Tour", "Cultural Visit", "Shopping Experience", "Dining Adventure", "Sightseeing"]
        },
        restaurants: ["Sukiyabashi Jiro", "Narisawa", "Den", "Kozasa", "Ramen Yashichi"],
        neighborhoods: ["Shibuya", "Shinjuku", "Harajuku", "Asakusa", "Ginza"]
      },
      "new york": {
        culture: {
          attractions: ["Metropolitan Museum", "MoMA", "Statue of Liberty", "9/11 Memorial", "Ellis Island"],
          activities: ["Museum Tour", "Art Gallery Visit", "Historical Site Tour", "Architecture Walk"]
        },
        shopping: {
          attractions: ["Fifth Avenue", "SoHo District", "Brooklyn Flea Market", "Macy's Herald Square", "Chelsea Market"],
          activities: ["Luxury Shopping", "Boutique Browse", "Vintage Shopping", "Market Shopping", "Designer Stores"]
        },
        foodie: {
          attractions: ["Little Italy", "Chinatown", "Food Trucks", "Smorgasburg", "Chelsea Market"],
          activities: ["Food Tour", "Pizza Crawl", "Bagel Tasting", "Food Market Visit", "Fine Dining"]
        },
        adventure: {
          attractions: ["Central Park Activities", "Brooklyn Bridge Walk", "High Line Park", "Helicopter Tours", "Kayaking Hudson"],
          activities: ["Park Adventures", "Bridge Walking", "Urban Hiking", "Aerial Tours", "Water Sports"]
        },
        relaxation: {
          attractions: ["Central Park", "Bryant Park", "The High Line", "Spa Centers", "Rooftop Gardens"],
          activities: ["Park Stroll", "Garden Relaxation", "Spa Treatment", "Rooftop Views", "Peaceful Walks"]
        },
        mixed: {
          attractions: ["Times Square", "Central Park", "Empire State Building", "Brooklyn Bridge", "Statue of Liberty"],
          activities: ["City Sightseeing", "Cultural Visit", "Shopping Walk", "Dining Experience", "Urban Exploration"]
        },
        restaurants: ["Le Bernardin", "Eleven Madison Park", "Per Se", "Daniel", "Gramercy Tavern"],
        neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
      },
      "london": {
        culture: {
          attractions: ["British Museum", "Tower of London", "Westminster Abbey", "Tate Modern", "National Gallery"],
          activities: ["Museum Tour", "Historical Site Visit", "Art Gallery Browse", "Royal Palace Tour"]
        },
        shopping: {
          attractions: ["Oxford Street", "Covent Garden", "Camden Market", "Portobello Road", "Harrods"],
          activities: ["High Street Shopping", "Market Browse", "Vintage Shopping", "Luxury Department Store", "Antique Hunting"]
        },
        foodie: {
          attractions: ["Borough Market", "Brick Lane", "Chinatown", "Food Markets", "Traditional Pubs"],
          activities: ["Market Food Tour", "Curry Experience", "Pub Crawl", "Afternoon Tea", "Fish & Chips"]
        },
        adventure: {
          attractions: ["Thames River Cruise", "London Eye", "Hyde Park Activities", "Cycling Tours", "Walking Tours"],
          activities: ["River Adventure", "Ferris Wheel Ride", "Park Activities", "City Cycling", "Historical Walks"]
        },
        relaxation: {
          attractions: ["Hyde Park", "Regent's Park", "Kew Gardens", "Spa Centers", "Thames Riverside"],
          activities: ["Park Stroll", "Garden Visit", "Riverside Walk", "Spa Treatment", "Peaceful Gardens"]
        },
        mixed: {
          attractions: ["Big Ben", "London Eye", "Tower Bridge", "Buckingham Palace", "Thames River"],
          activities: ["Sightseeing Tour", "Cultural Experience", "Shopping Walk", "Dining Adventure", "City Exploration"]
        },
        restaurants: ["Sketch", "Dishoom", "The Ledbury", "Hawksmoor", "Rules Restaurant"],
        neighborhoods: ["Covent Garden", "Shoreditch", "Camden", "Notting Hill", "Greenwich"]
      },
      "rome": {
        culture: {
          attractions: ["Colosseum", "Vatican Museums", "Roman Forum", "Pantheon", "Capitoline Museums"],
          activities: ["Ancient Rome Tour", "Vatican Art Tour", "Archaeological Walk", "Historical Site Visit"]
        },
        shopping: {
          attractions: ["Via del Corso", "Campo de' Fiori Market", "Trastevere Boutiques", "Via Nazionale", "Porta Portese Market"],
          activities: ["Fashion Shopping", "Local Market Browse", "Artisan Shopping", "Vintage Finds", "Italian Design"]
        },
        foodie: {
          attractions: ["Testaccio Market", "Trastevere Restaurants", "Campo de' Fiori", "Local Trattorias", "Gelato Shops"],
          activities: ["Food Market Tour", "Pasta Making Class", "Wine Tasting", "Gelato Tasting", "Roman Cuisine"]
        },
        adventure: {
          attractions: ["Appian Way Cycling", "Villa Borghese", "Tiber River", "Castel Sant'Angelo", "Roman Hills"],
          activities: ["Ancient Road Cycling", "Park Adventures", "River Activities", "Castle Exploration", "Hill Climbing"]
        },
        relaxation: {
          attractions: ["Villa Borghese", "Orange Garden", "Baths of Caracalla", "Spa Centers", "Tiber Riverside"],
          activities: ["Garden Stroll", "Scenic Views", "Ancient Spa Experience", "Peaceful Walks", "Riverside Relaxation"]
        },
        mixed: {
          attractions: ["Colosseum", "Trevi Fountain", "Vatican City", "Spanish Steps", "Roman Forum"],
          activities: ["Historical Tour", "Cultural Visit", "Shopping Experience", "Culinary Adventure", "City Exploration"]
        },
        restaurants: ["La Pergola", "Il Pagliaccio", "Armando al Pantheon", "Da Enzo al 29", "Trattoria Monti"],
        neighborhoods: ["Trastevere", "Campo de' Fiori", "Vatican", "Monti", "Testaccio"]
      },
      "mumbai": {
        culture: {
          attractions: ["Gateway of India", "Chhatrapati Shivaji Museum", "Elephanta Caves", "Crawford Market", "Dhobi Ghat"],
          activities: ["Heritage Walk", "Museum Visit", "Cave Exploration", "Local Culture Tour"]
        },
        shopping: {
          attractions: ["Linking Road", "Colaba Causeway", "Crawford Market", "Palladium Mall", "Chor Bazaar"],
          activities: ["Street Shopping", "Fashion Browse", "Antique Shopping", "Mall Shopping", "Local Markets"]
        },
        foodie: {
          attractions: ["Mohammed Ali Road", "Khau Galli", "Bandra Food Street", "Juhu Beach Food", "Local Restaurants"],
          activities: ["Street Food Tour", "Vada Pav Tasting", "Seafood Experience", "Local Cuisine", "Food Markets"]
        },
        adventure: {
          attractions: ["Marine Drive", "Juhu Beach", "Sanjay Gandhi National Park", "Elephanta Island", "Mumbai Harbor"],
          activities: ["Beach Activities", "Nature Park Trek", "Island Hopping", "Harbor Cruise", "Urban Adventures"]
        },
        relaxation: {
          attractions: ["Marine Drive", "Hanging Gardens", "Juhu Beach", "Spa Centers", "Worli Sea Face"],
          activities: ["Seaside Stroll", "Garden Relaxation", "Beach Relaxation", "Spa Treatment", "Sunset Views"]
        },
        mixed: {
          attractions: ["Gateway of India", "Marine Drive", "Colaba Causeway", "Juhu Beach", "Crawford Market"],
          activities: ["City Tour", "Cultural Experience", "Shopping Walk", "Food Adventure", "Coastal Exploration"]
        },
        restaurants: ["Trishna", "Britannia & Co.", "Leopold Cafe", "Bademiya", "Khyber Restaurant"],
        neighborhoods: ["Colaba", "Bandra", "Juhu", "Fort", "Worli"]
      },
      "delhi": {
        culture: {
          attractions: ["Red Fort", "Qutub Minar", "Humayun's Tomb", "Lotus Temple", "National Museum"],
          activities: ["Heritage Walk", "Mughal Architecture Tour", "Museum Visit", "Historical Site Tour"]
        },
        shopping: {
          attractions: ["Chandni Chowk", "Khan Market", "Karol Bagh", "Connaught Place", "Dilli Haat"],
          activities: ["Traditional Market Shopping", "Designer Shopping", "Handicraft Shopping", "Street Shopping", "Artisan Markets"]
        },
        foodie: {
          attractions: ["Paranthe Wali Gali", "Chandni Chowk Food Street", "Khan Market Eateries", "Old Delhi Food Tour", "Local Dhabas"],
          activities: ["Street Food Tour", "Paratha Tasting", "Chaat Experience", "Mughlai Cuisine", "Local Food Markets"]
        },
        adventure: {
          attractions: ["Yamuna River", "Ridge Forest", "Adventure Parks", "Cycling Tours", "Rock Climbing"],
          activities: ["River Activities", "Forest Trek", "Adventure Sports", "City Cycling", "Outdoor Adventures"]
        },
        relaxation: {
          attractions: ["Lodhi Gardens", "India Gate Lawns", "Spa Centers", "Buddha Jayanti Park", "Raj Ghat"],
          activities: ["Garden Stroll", "Peaceful Walks", "Spa Treatment", "Park Relaxation", "Meditation"]
        },
        mixed: {
          attractions: ["India Gate", "Red Fort", "Connaught Place", "Lotus Temple", "Chandni Chowk"],
          activities: ["City Tour", "Cultural Walk", "Shopping Experience", "Food Adventure", "Historical Exploration"]
        },
        restaurants: ["Indian Accent", "Bukhara", "Karim's", "Paranthe Wali Gali", "Lodi - The Garden Restaurant"],
        neighborhoods: ["Old Delhi", "Connaught Place", "Khan Market", "Hauz Khas", "Karol Bagh"]
      }
    };
    
    // Return city-specific data or generate generic data
    if (cityMappings[cityLower]) {
      return cityMappings[cityLower];
    }
    
    // Generate generic data for unknown cities
    return {
      attractions: [
        `${cityName} Historic Center`,
        `${cityName} Museum`,
        `${cityName} Cultural District`,
        `${cityName} Main Square`,
        `${cityName} Landmark`
      ],
      restaurants: [
        `Local ${cityName} Cuisine`,
        `Traditional ${cityName} Restaurant`,
        `${cityName} Street Food`,
        `Fine Dining ${cityName}`,
        `${cityName} Cafe`
      ],
      neighborhoods: [
        `Historic ${cityName}`,
        `Modern ${cityName}`,
        `Cultural Quarter`,
        `Local Markets`,
        `Residential District`
      ]
    };
  };
  
  const cityData = generateCityData(city);

  // Helper functions for style-specific content
  const getStyleSpecificAttraction = (cityData: any, travelStyles: string[], day: number, timeOfDay: string): string => {
    const primaryStyle = travelStyles.length > 0 ? travelStyles[0] : 'mixed';
    
    if (cityData[primaryStyle] && cityData[primaryStyle].attractions) {
      const attractions = cityData[primaryStyle].attractions;
      return attractions[day % attractions.length];
    }
    
    // Fallback to general attractions
    if (cityData.attractions) {
      return cityData.attractions[day % cityData.attractions.length];
    }
    
    return `${city} Local Attraction`;
  };

  const getStyleSpecificDescription = (cityData: any, travelStyles: string[], day: number, timeOfDay: string, city: string): string => {
    const primaryStyle = travelStyles.length > 0 ? travelStyles[0] : 'mixed';
    
    const descriptions = {
      shopping: `Explore the vibrant shopping scene with local markets, boutiques, and unique finds in ${city}.`,
      culture: `Start your day exploring this iconic ${city} landmark, perfect for morning visits when crowds are smaller.`,
      foodie: `Discover authentic local flavors and culinary experiences in ${city}'s food scene.`,
      adventure: `Embark on an exciting adventure activity that showcases ${city}'s natural beauty.`,
      relaxation: `Enjoy a peaceful and rejuvenating experience in ${city}'s serene locations.`,
      mixed: `Experience the diverse attractions and activities that ${city} has to offer.`
    };
    
    return descriptions[primaryStyle as keyof typeof descriptions] || descriptions.mixed;
  };

  const getActivityType = (travelStyles: string[]): string => {
    const primaryStyle = travelStyles.length > 0 ? travelStyles[0] : 'mixed';
    
    const activityTypes = {
      shopping: 'shopping',
      culture: 'attraction',
      foodie: 'dining',
      adventure: 'adventure',
      relaxation: 'wellness',
      mixed: 'attraction'
    };
    
    return activityTypes[primaryStyle as keyof typeof activityTypes] || 'attraction';
  };

  const dailyItinerary = [];
  for (let day = 1; day <= days; day++) {
    const styleThemes = {
      adventure: [
        "Outdoor Adventures",
        "Extreme Sports & Activities", 
        "Nature Exploration",
        "Adventure Parks & Thrills",
        "Mountain & Water Adventures"
      ],
      culture: [
        "Historic Discovery",
        "Cultural Immersion",
        "Art & Architecture", 
        "Museums & Galleries",
        "Local Traditions"
      ],
      foodie: [
        "Culinary Journey",
        "Street Food & Markets",
        "Fine Dining Experience",
        "Cooking Classes & Tours",
        "Local Specialties"
      ],
      shopping: [
        "Shopping Districts",
        "Local Markets & Boutiques",
        "Designer & Luxury Shopping",
        "Artisan Crafts",
        "Fashion & Style Tour"
      ],
      relaxation: [
        "Wellness & Spa Day",
        "Parks & Gardens",
        "Beach & Waterfront",
        "Peaceful Retreats",
        "Mindfulness & Nature"
      ],
      mixed: [
        "Historic Discovery",
        "Cultural Immersion", 
        "Local Life & Hidden Gems",
        "Art & Architecture",
        "Food & Market Adventures",
        "Nature & Relaxation",
        "Modern City Experience"
      ]
    };

    // Combine themes from all selected styles, or use mixed if none selected
    const selectedStyles = travelStyles.length > 0 ? travelStyles : ['mixed'];
    const primaryStyle = selectedStyles[0];
    const themes = styleThemes[primaryStyle as keyof typeof styleThemes] || styleThemes.mixed;
    const theme = themes[(day - 1) % themes.length];
    
    dailyItinerary.push({
      day,
      theme: `${theme} in ${city}`,
      summary: `Experience the ${theme.toLowerCase()} of ${city} with carefully curated activities that showcase the city's unique character and charm.`,
      activities: {
        morning: [{
          name: getStyleSpecificAttraction(cityData, travelStyles, day, 'morning'),
          description: getStyleSpecificDescription(cityData, travelStyles, day, 'morning', city),
          duration: "2-3 hours",
          cost: budgetCategory === "budget" ? 15 : budgetCategory === "mid-range" ? 25 : 50,
          type: getActivityType(travelStyles)
        }],
        afternoon: [{
          name: `${cityData.neighborhoods[day % cityData.neighborhoods.length]} Walking Tour`,
          description: `Discover the authentic local culture and hidden gems of this vibrant neighborhood.`,
          duration: "3 hours",
          cost: budgetCategory === "budget" ? 0 : budgetCategory === "mid-range" ? 20 : 80,
          type: "culture"
        }],
        evening: [{
          name: `${cityData.restaurants[day % cityData.restaurants.length]}`,
          description: `Enjoy an authentic dining experience at this highly-rated local restaurant.`,
          duration: "2 hours",
          cost: budgetCategory === "budget" ? 25 : budgetCategory === "mid-range" ? 45 : 120,
          type: "dining"
        }]
      },
      dining: {
        breakfast: {
          name: "Local Café",
          cuisine: "Local breakfast specialties",
          priceRange: budgetCategory === "budget" ? "$8-12" : budgetCategory === "mid-range" ? "$15-25" : "$30-50",
          estimatedCost: budgetCategory === "budget" ? 10 : budgetCategory === "mid-range" ? 20 : 40,
          description: "Start your day with authentic local breakfast favorites."
        },
        lunch: {
          name: "Neighborhood Bistro",
          cuisine: "Regional specialties",
          priceRange: budgetCategory === "budget" ? "$12-18" : budgetCategory === "mid-range" ? "$20-35" : "$50-80",
          estimatedCost: budgetCategory === "budget" ? 15 : budgetCategory === "mid-range" ? 30 : 65,
          description: "Enjoy traditional local cuisine in a charming setting."
        },
        dinner: {
          name: cityData.restaurants[day % cityData.restaurants.length],
          cuisine: "Fine dining",
          priceRange: budgetCategory === "budget" ? "$20-30" : budgetCategory === "mid-range" ? "$40-70" : "$100-200",
          estimatedCost: budgetCategory === "budget" ? 25 : budgetCategory === "mid-range" ? 55 : 150,
          description: "Experience exceptional dining at this acclaimed restaurant."
        }
      },
      navigation: `Use the efficient public transportation system. Most attractions are accessible by metro/bus. Consider purchasing a day pass for unlimited travel.`,
      optionalActivities: [{
        name: "Evening Entertainment",
        description: "Optional evening activity based on your interests.",
        duration: "2-3 hours",
        cost: budgetCategory === "budget" ? 20 : budgetCategory === "mid-range" ? 40 : 100,
        type: "entertainment"
      }],
      estimatedCost: Math.round(budget.daily * 0.9 + Math.random() * budget.daily * 0.2)
    });
  }

  return {
    city,
    days,
    budget: budget.total,
    currency,
    dailyItinerary
  };
};

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Utensils,
  Camera,
  Navigation2,
  Star,
  Download,
  Printer,
} from "lucide-react";
import SimpleMap from "@/components/SimpleMap";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TravelPlan {
  city: string;
  days: number;
  budget: number;
  currency: string;
  dailyItinerary: DayPlan[];
}

interface DayPlan {
  day: number;
  theme: string;
  summary: string;
  activities: {
    morning: Activity[];
    afternoon: Activity[];
    evening: Activity[];
  };
  dining: {
    breakfast: DiningOption;
    lunch: DiningOption;
    dinner: DiningOption;
  };
  navigation: string;
  optionalActivities: Activity[];
  estimatedCost: number;
}

interface Activity {
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: "attraction" | "culture" | "hidden-gem" | "relaxation";
}

interface DiningOption {
  name: string;
  cuisine: string;
  priceRange: string;
  estimatedCost: number;
  description: string;
}

export default function Index() {
  const [formData, setFormData] = useState({
    city: "",
    days: "",
    budgetCategory: "",
    currency: "USD",
    travelStyles: [] as string[],
  });
  const pdfRef = useRef<HTMLDivElement>(null);

  // Travel style options
  const travelStyles = {
    adventure: {
      label: "Adventure",
      description: "Outdoor activities, hiking, extreme sports, nature exploration",
      icon: "🏔️",
    },
    culture: {
      label: "Culture",
      description: "Museums, historical sites, local traditions, art galleries",
      icon: "🏛️",
    },
    foodie: {
      label: "Foodie",
      description: "Local cuisine, food tours, cooking classes, markets",
      icon: "🍽️",
    },
    shopping: {
      label: "Shopping",
      description: "Local markets, boutiques, shopping districts, souvenirs",
      icon: "🛍️",
    },
    relaxation: {
      label: "Relaxation",
      description: "Spas, beaches, parks, leisurely activities, wellness",
      icon: "🧘",
    },
    mixed: {
      label: "Mixed",
      description: "Balanced combination of all travel experiences",
      icon: "🌟",
    },
  };

  // Budget categories with their corresponding daily amounts
  const budgetCategories = {
    budget: {
      label: "Budget",
      dailyAmount: 50,
      description: "Essential experiences, local food, budget accommodations",
    },
    "mid-range": {
      label: "Mid-range",
      dailyAmount: 120,
      description: "Comfortable stays, mix of experiences, good restaurants",
    },
    luxury: {
      label: "Luxury",
      dailyAmount: 300,
      description: "Premium experiences, fine dining, luxury accommodations",
    },
    "ultra-luxury": {
      label: "Ultra Luxury",
      dailyAmount: 500,
      description: "Exclusive experiences, Michelin dining, 5-star everything",
    },
  };
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper function to get city coordinates
  const getCityCoordinates = (city: string): [number, number] => {
    const cityCoords: Record<string, [number, number]> = {
      'new york': [40.7128, -74.0060],
      'london': [51.5074, -0.1278],
      'paris': [48.8566, 2.3522],
      'tokyo': [35.6762, 139.6503],
      'sydney': [-33.8688, 151.2093],
      'rome': [41.9028, 12.4964],
      'barcelona': [41.3851, 2.1734],
      'amsterdam': [52.3676, 4.9041],
      'berlin': [52.5200, 13.4050],
      'madrid': [40.4168, -3.7038],
      'dubai': [25.2048, 55.2708],
      'singapore': [1.3521, 103.8198],
      'mumbai': [19.0760, 72.8777],
      'delhi': [28.7041, 77.1025],
      'bangkok': [13.7563, 100.5018],
      'istanbul': [41.0082, 28.9784],
      'cairo': [30.0444, 31.2357],
      'moscow': [55.7558, 37.6176],
      'beijing': [39.9042, 116.4074],
      'seoul': [37.5665, 126.9780],
    };
    
    const normalizedCity = city.toLowerCase().trim();
    return cityCoords[normalizedCity] || [40.7128, -74.0060]; // Default to NYC
  };

  const generateItinerary = async () => {
    if (!formData.city || !formData.days || !formData.budgetCategory) return;

    setIsGenerating(true);

    try {
      console.log("Generating itinerary with Gemini AI...");
      
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: formData.city,
          days: parseInt(formData.days),
          budgetCategory: formData.budgetCategory,
          currency: formData.currency,
          travelStyles: formData.travelStyles,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        console.log("AI-generated itinerary:", result.data);
        setTravelPlan(result.data);
        // Scroll to top after plan is generated
        window.scrollTo(0, 0);
      } else {
        console.error("Failed to generate itinerary:", result.error);
        alert("Failed to generate itinerary. Using fallback mock data.");
        
        // Fallback to mock data
        const dailyAmount =
          budgetCategories[formData.budgetCategory as keyof typeof budgetCategories]
            .dailyAmount;
        const totalBudget = dailyAmount * parseInt(formData.days);
        
        const plan = generateMockItinerary(
          formData.city,
          parseInt(formData.days),
          totalBudget,
          formData.currency,
          formData.budgetCategory,
          formData.travelStyles,
        );
        setTravelPlan(plan);
        // Scroll to top after fallback plan is generated
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert("Error connecting to AI service. Using fallback mock data.");
      
      // Fallback to mock data
      const dailyAmount =
        budgetCategories[formData.budgetCategory as keyof typeof budgetCategories]
          .dailyAmount;
      const totalBudget = dailyAmount * parseInt(formData.days);
      
      const plan = generateMockItinerary(
        formData.city,
        parseInt(formData.days),
        totalBudget,
        formData.currency,
        formData.budgetCategory,
        formData.travelStyles,
      );
      setTravelPlan(plan);
      // Scroll to top after error fallback plan is generated
      window.scrollTo(0, 0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlanNewTrip = () => {
    console.log("Plan New Trip function called!");
    
    // Reset all states immediately
    setTravelPlan(null);
    setIsGenerating(false);
    setIsGeneratingPDF(false);
    setFormData({
      city: "",
      days: "",
      budgetCategory: "",
      currency: "USD",
      travelStyles: [],
    });
    
    // Force a re-render by scrolling to top
    window.scrollTo(0, 0);
  };

  const generatePDF = async () => {
    console.log("PDF generation started!");
    
    if (!travelPlan) {
      alert("Please generate a travel plan first before downloading the PDF.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Simple PDF generation
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`${travelPlan.city} Travel Itinerary`, 20, 30);
      
      // Basic info
      pdf.setFontSize(12);
      pdf.text(`Duration: ${travelPlan.days} days`, 20, 50);
      pdf.text(`Budget: ${travelPlan.budget} ${travelPlan.currency}`, 20, 60);
      
      if (formData.travelStyles.length > 0) {
        const selectedStyles = formData.travelStyles.map(style => {
          const styleInfo = travelStyles[style as keyof typeof travelStyles];
          return `${styleInfo?.icon} ${styleInfo?.label}`;
        }).join(', ');
        pdf.text(`Travel Styles: ${selectedStyles}`, 20, 70);
      }
      
      let yPos = 90;
      
      // Add each day
      travelPlan.dailyItinerary?.forEach((day, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 30;
        }
        
        // Day header
        pdf.setFontSize(16);
        pdf.setTextColor(0, 100, 200);
        pdf.text(`Day ${day.day}: ${day.theme || 'Daily Activities'}`, 20, yPos);
        yPos += 15;
        
        // Day summary
        if (day.summary) {
          pdf.setFontSize(10);
          pdf.setTextColor(80, 80, 80);
          const summaryLines = pdf.splitTextToSize(day.summary, 170);
          pdf.text(summaryLines, 20, yPos);
          yPos += summaryLines.length * 5 + 10;
        }
        
        // Activities
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Activities:', 20, yPos);
        yPos += 10;
        
        // Morning
        if (day.activities?.morning?.length > 0) {
          pdf.setFontSize(10);
          day.activities.morning.forEach(activity => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 30;
            }
            pdf.text(`• Morning: ${activity.name} (${activity.duration || 'N/A'})`, 25, yPos);
            yPos += 8;
          });
        }
        
        // Afternoon
        if (day.activities?.afternoon?.length > 0) {
          day.activities.afternoon.forEach(activity => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 30;
            }
            pdf.text(`• Afternoon: ${activity.name} (${activity.duration || 'N/A'})`, 25, yPos);
            yPos += 8;
          });
        }
        
        // Evening
        if (day.activities?.evening?.length > 0) {
          day.activities.evening.forEach(activity => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 30;
            }
            pdf.text(`• Evening: ${activity.name} (${activity.duration || 'N/A'})`, 25, yPos);
            yPos += 8;
          });
        }
        
        // Cost estimate
        if (day.estimatedCost) {
          pdf.setTextColor(0, 150, 0);
          pdf.text(`Daily Cost: ~${day.estimatedCost} ${travelPlan.currency}`, 20, yPos);
          yPos += 15;
        }
        
        yPos += 10; // Space between days
      });
      
      // Download
      const fileName = `${travelPlan.city.replace(/\s+/g, '_')}_Itinerary.pdf`;
      pdf.save(fileName);
      
      alert(`PDF downloaded successfully as "${fileName}"`);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };



  // Enhanced PDF generation method
  const generatePDFFallback = async () => {
    console.log("generatePDFFallback started");
    
    if (!travelPlan) {
      console.error("No travel plan in generatePDFFallback");
      return;
    }

    console.log("Travel plan data:", {
      city: travelPlan.city,
      days: travelPlan.days,
      budget: travelPlan.budget,
      currency: travelPlan.currency,
      dailyItineraryLength: travelPlan.dailyItinerary?.length
    });

    const budgetCat =
      budgetCategories[
        formData.budgetCategory as keyof typeof budgetCategories
      ];

    console.log("Budget category:", budgetCat);

    // Calculate total estimated cost
    const totalEstimatedCost = travelPlan.dailyItinerary?.reduce(
      (sum, day) => sum + (day.estimatedCost || 0),
      0
    ) || 0;

    console.log("Total estimated cost:", totalEstimatedCost);

    // Create PDF
    console.log("Creating jsPDF instance...");
    let pdf;
    try {
      pdf = new jsPDF();
      console.log("jsPDF instance created successfully");
    } catch (error) {
      console.error("Failed to create jsPDF instance:", error);
      throw new Error("Failed to initialize PDF generator");
    }
    
    // Add header
    console.log("Adding PDF header...");
    try {
      pdf.setFontSize(24);
      pdf.setTextColor(79, 70, 229); // Blue color
      pdf.text(`${travelPlan.city} Travel Itinerary`, 20, 20);
      console.log("Header added successfully");
    } catch (error) {
      console.error("Failed to add header:", error);
      throw new Error("Failed to add PDF header");
    }
    
    // Add subtitle
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${travelPlan.days} days • ${budgetCat.label} Budget • ${travelPlan.budget} ${travelPlan.currency} total`, 20, 30);
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(5, 150, 105); // Green color
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 40);
    
    // Add trip summary
    pdf.setFontSize(16);
    pdf.setTextColor(30, 41, 59); // Dark color
    pdf.text("Trip Summary", 20, 55);
    
    // Summary details
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Total Days: ${travelPlan.days}`, 20, 65);
    pdf.text(`Budget: ${travelPlan.budget} ${travelPlan.currency}`, 20, 72);
    pdf.text(`Estimated Total Cost: ${totalEstimatedCost} ${travelPlan.currency}`, 20, 79);
    
    let yPosition = 95;
    
    // Add each day
    console.log("Adding daily itinerary to PDF...");
    if (!travelPlan.dailyItinerary || travelPlan.dailyItinerary.length === 0) {
      console.error("No daily itinerary data available");
      throw new Error("No itinerary data to generate PDF");
    }
    
    travelPlan.dailyItinerary.forEach((day, index) => {
      console.log(`Processing day ${day.day}:`, {
        theme: day.theme,
        activitiesCount: {
          morning: day.activities?.morning?.length || 0,
          afternoon: day.activities?.afternoon?.length || 0,
          evening: day.activities?.evening?.length || 0
        }
      });
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Day header with background
      pdf.setFillColor(79, 70, 229);
      pdf.rect(15, yPosition - 5, 180, 15, 'F');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Day ${day.day}: ${day.theme}`, 20, yPosition + 5);
      yPosition += 20;
      
      // Day summary
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const summaryLines = pdf.splitTextToSize(day.summary, 170);
      pdf.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 10;
      
      // Activities
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      pdf.text("Activities:", 20, yPosition);
      yPosition += 8;
      
      // Morning activities
      if (day.activities?.morning && Array.isArray(day.activities.morning)) {
        day.activities.morning.forEach(activity => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(10);
        pdf.text(`🌅 ${activity.name} (${activity.duration}) - ${activity.cost === 0 ? "Free" : `${activity.cost} ${travelPlan.currency}`}`, 25, yPosition);
        yPosition += 6;
        const descLines = pdf.splitTextToSize(activity.description, 160);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(descLines, 25, yPosition);
        yPosition += descLines.length * 4 + 3;
        });
      }
      
      // Afternoon activities
      if (day.activities?.afternoon && Array.isArray(day.activities.afternoon)) {
        day.activities.afternoon.forEach(activity => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        pdf.text(`☀️ ${activity.name} (${activity.duration}) - ${activity.cost === 0 ? "Free" : `${activity.cost} ${travelPlan.currency}`}`, 25, yPosition);
        yPosition += 6;
        const descLines = pdf.splitTextToSize(activity.description, 160);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(descLines, 25, yPosition);
        yPosition += descLines.length * 4 + 3;
        });
      }
      
      // Evening activities
      if (day.activities?.evening && Array.isArray(day.activities.evening)) {
        day.activities.evening.forEach(activity => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        pdf.text(`🌙 ${activity.name} (${activity.duration}) - ${activity.cost === 0 ? "Free" : `${activity.cost} ${travelPlan.currency}`}`, 25, yPosition);
        yPosition += 6;
        const descLines = pdf.splitTextToSize(activity.description, 160);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(descLines, 25, yPosition);
        yPosition += descLines.length * 4 + 3;
        });
      }
      
      // Dining
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      pdf.text("Dining:", 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      if (day.dining?.breakfast) {
        pdf.text(`🍽️ Breakfast: ${day.dining.breakfast.name} - ${day.dining.breakfast.priceRange}`, 25, yPosition);
        yPosition += 6;
      }
      if (day.dining?.lunch) {
        pdf.text(`🍽️ Lunch: ${day.dining.lunch.name} - ${day.dining.lunch.priceRange}`, 25, yPosition);
        yPosition += 6;
      }
      if (day.dining?.dinner) {
        pdf.text(`🍽️ Dinner: ${day.dining.dinner.name} - ${day.dining.dinner.priceRange}`, 25, yPosition);
      }
      yPosition += 10;
      
      // Navigation
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      pdf.text("Navigation:", 20, yPosition);
      yPosition += 8;
      
      if (day.navigation) {
        const navLines = pdf.splitTextToSize(day.navigation, 170);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(navLines, 20, yPosition);
        yPosition += navLines.length * 4 + 10;
      }
      
      // Daily cost
      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105); // Green color
      pdf.text(`Daily Cost Estimate: ~${day.estimatedCost || 0} ${travelPlan.currency}`, 20, yPosition);
      yPosition += 15;
    });
    
    console.log("Daily itinerary added to PDF successfully");
    
    // Add comprehensive footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 280, 190, 280);
      
      // Footer text
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated by AI Travel Planner • ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 20, 285);
      pdf.text("This itinerary is for planning purposes only. Please verify all information before your trip.", 20, 290);
    }
    
    // Download the PDF
    console.log("Preparing PDF download...");
    try {
      const fileName = `${travelPlan.city.replace(/\s+/g, "_")}_Travel_Itinerary_${new Date().toISOString().split("T")[0]}.pdf`;
      console.log("Generated filename:", fileName);
      
      console.log("Calling pdf.save()...");
      pdf.save(fileName);
      
      console.log("Enhanced PDF generated successfully!");
      alert(`PDF downloaded successfully as "${fileName}"`);
    } catch (error) {
      console.error("Failed to save PDF:", error);
      throw new Error("Failed to download PDF file");
    }
  };

  const generateMockItinerary = (
    city: string,
    days: number,
    budget: number,
    currency: string,
    budgetCategory: string,
    travelStyles: string[],
  ): TravelPlan => {
    const dailyBudget = budget / days;
    const dailyPlans: DayPlan[] = [];

    for (let i = 1; i <= days; i++) {
      dailyPlans.push({
        day: i,
        theme: getThemeForDay(i, city, travelStyles),
        summary: getSummaryForDay(i, city, travelStyles),
        activities: {
          morning: getMorningActivities(city, i, budgetCategory, travelStyles),
          afternoon: getAfternoonActivities(city, i, budgetCategory, travelStyles),
          evening: getEveningActivities(city, i, budgetCategory, travelStyles),
        },
        dining: {
          breakfast: getBreakfastOption(city, dailyBudget, budgetCategory),
          lunch: getLunchOption(city, dailyBudget, budgetCategory),
          dinner: getDinnerOption(city, dailyBudget, budgetCategory),
        },
        navigation: getNavigationTips(city, i),
        optionalActivities: getOptionalActivities(city, i, budgetCategory, travelStyles),
        estimatedCost: Math.round(
          dailyBudget * 0.9 + Math.random() * dailyBudget * 0.2,
        ),
      });
    }

    return {
      city,
      days,
      budget,
      currency,
      dailyItinerary: dailyPlans,
    };
  };

  // Helper functions for generating realistic content
  const getThemeForDay = (day: number, city: string, travelStyles: string[]): string => {
    const styleThemes = {
      adventure: [
        `${city} Outdoor Adventures`,
        `Extreme Sports & Activities`,
        `Nature Exploration & Hiking`,
        `Adventure Parks & Thrills`,
        `Mountain & Water Adventures`,
      ],
      culture: [
        `Historic ${city} Discovery`,
        `Museums & Art Galleries`,
        `Local Traditions & Heritage`,
        `Architecture & Monuments`,
        `Cultural Districts Tour`,
      ],
      foodie: [
        `${city} Culinary Journey`,
        `Street Food & Markets`,
        `Fine Dining Experience`,
        `Cooking Classes & Food Tours`,
        `Local Specialties & Tastings`,
      ],
      shopping: [
        `${city} Shopping Districts`,
        `Local Markets & Boutiques`,
        `Designer & Luxury Shopping`,
        `Artisan Crafts & Souvenirs`,
        `Fashion & Style Tour`,
      ],
      relaxation: [
        `Wellness & Spa Day`,
        `Parks & Gardens Tour`,
        `Beach & Waterfront Relaxation`,
        `Peaceful Retreats`,
        `Mindfulness & Nature`,
      ],
      mixed: [
        `Historic ${city} Discovery`,
        `Cultural Immersion & Local Life`,
        `Hidden Gems & Local Favorites`,
        `Art, Museums & Architecture`,
        `Food & Market Adventures`,
        `Nature & Relaxation`,
        `Modern ${city} & Shopping`,
      ],
    };
    // Combine themes from all selected styles, or use mixed if none selected
    const selectedStyles = travelStyles.length > 0 ? travelStyles : ['mixed'];
    const primaryStyle = selectedStyles[0];
    const themes = styleThemes[primaryStyle as keyof typeof styleThemes] || styleThemes.mixed;
    return themes[(day - 1) % themes.length];
  };

  const getSummaryForDay = (day: number, city: string, travelStyles: string[]): string => {
    const styleSummaries = {
      adventure: [
        `Embark on thrilling outdoor adventures and adrenaline-pumping activities in ${city}.`,
        `Challenge yourself with extreme sports and exciting physical activities.`,
        `Explore the natural landscapes and wilderness areas around ${city}.`,
        `Experience heart-racing adventures and outdoor challenges.`,
        `Discover the adventurous side of ${city} with action-packed activities.`,
      ],
      culture: [
        `Explore the historic heart of ${city} with iconic landmarks and cultural sites.`,
        `Immerse yourself in local traditions, museums, and artistic heritage.`,
        `Discover the cultural depth of ${city} through its monuments and history.`,
        `Experience authentic local culture and traditional practices.`,
        `Dive deep into ${city}'s rich cultural tapestry and artistic legacy.`,
      ],
      foodie: [
        `Embark on a culinary journey through ${city}'s diverse food scene.`,
        `Discover local flavors, street food, and traditional cooking methods.`,
        `Indulge in fine dining and gourmet experiences unique to ${city}.`,
        `Learn about local cuisine through hands-on cooking and food tours.`,
        `Taste your way through ${city} with authentic local specialties.`,
      ],
      shopping: [
        `Explore ${city}'s vibrant shopping districts and local markets.`,
        `Hunt for unique finds in boutiques, artisan shops, and local stores.`,
        `Experience luxury shopping and designer brands in ${city}.`,
        `Discover handcrafted souvenirs and local artisan products.`,
        `Navigate the fashion scene and style culture of ${city}.`,
      ],
      relaxation: [
        `Unwind and rejuvenate with peaceful activities and wellness experiences.`,
        `Find tranquility in ${city}'s beautiful parks, gardens, and serene spots.`,
        `Enjoy leisurely activities and stress-free exploration of ${city}.`,
        `Focus on wellness, mindfulness, and relaxation throughout the day.`,
        `Balance sightseeing with restorative and calming experiences.`,
      ],
      mixed: [
        `Explore the historic heart of ${city} with iconic landmarks and charming old quarters.`,
        `Dive into local culture with authentic experiences and neighborhood exploration.`,
        `Discover secret spots and hidden gems that locals love to visit.`,
        `Immerse yourself in art, history, and stunning architecture.`,
        `Taste your way through the city with markets, street food, and local cuisine.`,
        `Balance sightseeing with relaxation in parks and scenic areas.`,
        `Experience modern ${city} with shopping, contemporary culture, and nightlife.`,
      ],
    };
    // Combine summaries from all selected styles, or use mixed if none selected
    const selectedStyles = travelStyles.length > 0 ? travelStyles : ['mixed'];
    const primaryStyle = selectedStyles[0];
    const summaries = styleSummaries[primaryStyle as keyof typeof styleSummaries] || styleSummaries.mixed;
    return summaries[(day - 1) % summaries.length];
  };

  const getMorningActivities = (
    city: string,
    day: number,
    budgetCategory: string,
    travelStyles: string[],
  ): Activity[] => {
    const styleActivities = {
      adventure: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: `${city} Hiking Trail`,
              description: "Explore scenic hiking trails with stunning city views",
              duration: "3 hours",
              cost: budgetCategory === "budget" ? 0 : 20,
              type: "attraction" as const,
            },
            {
              name: "Rock Climbing Experience",
              description: "Indoor or outdoor climbing with equipment rental",
              duration: "2.5 hours",
              cost: budgetCategory === "budget" ? 25 : 45,
              type: "attraction" as const,
            },
          ]
        : [
            {
              name: "Private Adventure Guide",
              description: "Personal guide for extreme sports and adventure activities",
              duration: "4 hours",
              cost: budgetCategory === "luxury" ? 200 : 350,
              type: "attraction" as const,
            },
          ],
      culture: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: `${city} Free Walking Tour`,
              description: "Tip-based walking tour of historic center and cultural sites",
              duration: "2.5 hours",
              cost: budgetCategory === "budget" ? 0 : 15,
              type: "culture" as const,
            },
            {
              name: "Museum Morning",
              description: "Visit local history museum with audio guide",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 12 : 20,
              type: "culture" as const,
            },
          ]
        : [
            {
              name: `Private ${city} Historic Tour`,
              description: "Exclusive guided tour with local historian",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 120 : 200,
              type: "culture" as const,
            },
          ],
      foodie: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: "Local Market Food Tour",
              description: "Taste local specialties at traditional markets",
              duration: "2.5 hours",
              cost: budgetCategory === "budget" ? 15 : 30,
              type: "culture" as const,
            },
            {
              name: "Street Food Walking Tour",
              description: "Discover authentic street food with local guide",
              duration: "3 hours",
              cost: budgetCategory === "budget" ? 20 : 35,
              type: "culture" as const,
            },
          ]
        : [
            {
              name: "VIP Market & Cooking Class",
              description: "Private market tour with hands-on cooking experience",
              duration: "4 hours",
              cost: budgetCategory === "luxury" ? 150 : 250,
              type: "culture" as const,
            },
          ],
      shopping: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: "Local Markets Tour",
              description: "Explore traditional markets and artisan shops",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 0 : 10,
              type: "culture" as const,
            },
            {
              name: "Shopping District Walk",
              description: "Self-guided tour of main shopping areas",
              duration: "2.5 hours",
              cost: 0,
              type: "attraction" as const,
            },
          ]
        : [
            {
              name: "Personal Shopping Experience",
              description: "Private shopping guide for luxury boutiques",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 100 : 180,
              type: "culture" as const,
            },
          ],
      relaxation: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: "City Park Morning Walk",
              description: "Peaceful stroll through beautiful city parks",
              duration: "1.5 hours",
              cost: 0,
              type: "relaxation" as const,
            },
            {
              name: "Public Gardens Visit",
              description: "Explore botanical gardens and green spaces",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 5 : 12,
              type: "relaxation" as const,
            },
          ]
        : [
            {
              name: "Luxury Spa Morning",
              description: "Premium spa treatments and wellness experience",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 150 : 250,
              type: "relaxation" as const,
            },
          ],
      mixed: budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: `${city} Free Walking Tour`,
              description: "Start your journey with a tip-based walking tour of the historic center",
              duration: "2.5 hours",
              cost: budgetCategory === "budget" ? 0 : 15,
              type: "attraction" as const,
            },
            {
              name: "Local Market Experience",
              description: "Explore bustling local markets and interact with vendors",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 0 : 10,
              type: "culture" as const,
            },
          ]
        : [
            {
              name: `Private ${city} Historic Tour`,
              description: "Exclusive guided tour with local historian and transportation",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 120 : 200,
              type: "attraction" as const,
            },
          ],
    };
    // Use the first selected style, or mixed if none selected
    const selectedStyles = travelStyles.length > 0 ? travelStyles : ['mixed'];
    const primaryStyle = selectedStyles[0];
    const activities = styleActivities[primaryStyle as keyof typeof styleActivities] || styleActivities.mixed;
    return [activities[day % activities.length]];
  };

  const getAfternoonActivities = (
    city: string,
    day: number,
    budgetCategory: string,
    travelStyles: string[],
  ): Activity[] => {
    const activities =
      budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: `${city} Museum of Art`,
              description: "World-class art collection spanning centuries",
              duration: "3 hours",
              cost: budgetCategory === "budget" ? 15 : 25,
              type: "culture" as const,
            },
            {
              name: "Neighborhood Exploration",
              description:
                "Wander through charming local neighborhoods with self-guided map",
              duration: "2.5 hours",
              cost: 0,
              type: "hidden-gem" as const,
            },
          ]
        : [
            {
              name: `${city} Private Museum Tour`,
              description:
                "Skip-the-line access with private art historian guide",
              duration: "2.5 hours",
              cost: budgetCategory === "luxury" ? 80 : 150,
              type: "culture" as const,
            },
            {
              name: "Exclusive Neighborhood Experience",
              description:
                "Private guided tour of hidden gems with local insider",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 100 : 180,
              type: "hidden-gem" as const,
            },
          ];
    return [activities[day % activities.length]];
  };

  const getEveningActivities = (
    city: string,
    day: number,
    budgetCategory: string,
    travelStyles: string[],
  ): Activity[] => {
    const activities =
      budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: "Sunset Viewpoint",
              description:
                "Watch the sunset from the best free viewpoint in the city",
              duration: "1.5 hours",
              cost: 0,
              type: "relaxation" as const,
            },
            {
              name: "Traditional Performance",
              description:
                "Experience local music, dance, or theater at community venue",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 20 : 35,
              type: "culture" as const,
            },
          ]
        : [
            {
              name: "Private Rooftop Experience",
              description: "Exclusive sunset viewing with champagne service",
              duration: "2 hours",
              cost: budgetCategory === "luxury" ? 120 : 200,
              type: "relaxation" as const,
            },
            {
              name: "Premium Cultural Experience",
              description: "VIP seats at acclaimed theater or opera house",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 150 : 300,
              type: "culture" as const,
            },
          ];
    return [activities[day % activities.length]];
  };

  const getBreakfastOption = (
    city: string,
    dailyBudget: number,
    budgetCategory: string,
  ): DiningOption => {
    const options = {
      budget: {
        name: "Local Bakery & Coffee",
        cuisine: "Traditional pastries",
        priceRange: "$5-8",
        estimatedCost: Math.round(dailyBudget * 0.12),
        description: "Fresh pastries and coffee from neighborhood bakery",
      },
      "mid-range": {
        name: "Popular Local Cafe",
        cuisine: "Local breakfast specialties",
        priceRange: "$10-15",
        estimatedCost: Math.round(dailyBudget * 0.15),
        description: "Well-reviewed cafe with traditional breakfast dishes",
      },
      luxury: {
        name: "Boutique Hotel Restaurant",
        cuisine: "Gourmet breakfast",
        priceRange: "$25-35",
        estimatedCost: Math.round(dailyBudget * 0.18),
        description: "Refined breakfast experience with premium ingredients",
      },
      "ultra-luxury": {
        name: "Michelin-Starred Brunch",
        cuisine: "Haute cuisine breakfast",
        priceRange: "$50-80",
        estimatedCost: Math.round(dailyBudget * 0.2),
        description: "World-class breakfast by acclaimed chef",
      },
    };
    return options[budgetCategory as keyof typeof options];
  };

  const getLunchOption = (
    city: string,
    dailyBudget: number,
    budgetCategory: string,
  ): DiningOption => {
    const options = {
      budget: {
        name: "Street Food Vendors",
        cuisine: "Local street food",
        priceRange: "$8-12",
        estimatedCost: Math.round(dailyBudget * 0.2),
        description: "Authentic and affordable local flavors from food stalls",
      },
      "mid-range": {
        name: "Popular Local Restaurant",
        cuisine: "Regional specialties",
        priceRange: "$15-25",
        estimatedCost: Math.round(dailyBudget * 0.25),
        description: "Well-rated restaurant serving traditional dishes",
      },
      luxury: {
        name: "Award-Winning Restaurant",
        cuisine: "Contemporary local cuisine",
        priceRange: "$40-60",
        estimatedCost: Math.round(dailyBudget * 0.28),
        description: "Innovative takes on regional cuisine in elegant setting",
      },
      "ultra-luxury": {
        name: "Celebrity Chef Restaurant",
        cuisine: "Signature tasting menu",
        priceRange: "$80-120",
        estimatedCost: Math.round(dailyBudget * 0.3),
        description: "Exclusive dining experience with world-renowned chef",
      },
    };
    return options[budgetCategory as keyof typeof options];
  };

  const getDinnerOption = (
    city: string,
    dailyBudget: number,
    budgetCategory: string,
  ): DiningOption => {
    const options = {
      budget: {
        name: "Local Family Restaurant",
        cuisine: "Home-style cooking",
        priceRange: "$12-18",
        estimatedCost: Math.round(dailyBudget * 0.3),
        description: "Hearty, traditional meals in welcoming family atmosphere",
      },
      "mid-range": {
        name: "Highly-Rated Bistro",
        cuisine: "Modern local cuisine",
        priceRange: "$25-40",
        estimatedCost: Math.round(dailyBudget * 0.35),
        description: "Stylish restaurant with excellent local wine selection",
      },
      luxury: {
        name: "Fine Dining Establishment",
        cuisine: "Gourmet tasting menu",
        priceRange: "$80-120",
        estimatedCost: Math.round(dailyBudget * 0.4),
        description: "Multi-course dining experience with wine pairings",
      },
      "ultra-luxury": {
        name: "Michelin 3-Star Restaurant",
        cuisine: "Haute cuisine masterpiece",
        priceRange: "$200-350",
        estimatedCost: Math.round(dailyBudget * 0.45),
        description:
          "Unforgettable culinary journey at world's finest restaurant",
      },
    };
    return options[budgetCategory as keyof typeof options];
  };

  const getNavigationTips = (city: string, day: number): string => {
    const tips = [
      "Stay in the historic center - most attractions are within walking distance. Use metro line 1 for longer distances.",
      "This area is best explored on foot. Rent a bike for quicker travel between neighborhoods.",
      "Use the city bus system - buy a day pass for unlimited rides. Download the local transport app.",
      "Most locations are metro-accessible. Walk between nearby attractions to soak in the atmosphere.",
    ];
    return tips[day % tips.length];
  };

  const getOptionalActivities = (
    city: string,
    day: number,
    budgetCategory: string,
    travelStyles: string[],
  ): Activity[] => {
    const activities =
      budgetCategory === "budget" || budgetCategory === "mid-range"
        ? [
            {
              name: "Public River Boat Tour",
              description: "See the city from the water on scheduled boat tour",
              duration: "1.5 hours",
              cost: budgetCategory === "budget" ? 15 : 25,
              type: "attraction" as const,
            },
            {
              name: "Group Cooking Class",
              description: "Learn to make local dishes with other travelers",
              duration: "3 hours",
              cost: budgetCategory === "budget" ? 45 : 70,
              type: "culture" as const,
            },
            {
              name: "Local Bar Experience",
              description: "Drinks at popular neighborhood bar",
              duration: "2 hours",
              cost: budgetCategory === "budget" ? 20 : 35,
              type: "relaxation" as const,
            },
          ]
        : [
            {
              name: "Private Yacht Charter",
              description:
                "Exclusive boat experience with captain and refreshments",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 200 : 400,
              type: "attraction" as const,
            },
            {
              name: "Private Chef Experience",
              description: "Personal cooking lesson with renowned local chef",
              duration: "4 hours",
              cost: budgetCategory === "luxury" ? 250 : 500,
              type: "culture" as const,
            },
            {
              name: "Exclusive Rooftop Club",
              description: "VIP access to premium rooftop lounge",
              duration: "3 hours",
              cost: budgetCategory === "luxury" ? 120 : 250,
              type: "relaxation" as const,
            },
          ];
    return [activities[day % activities.length]];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "attraction":
        return <Camera className="h-4 w-4" />;
      case "culture":
        return <Star className="h-4 w-4" />;
      case "hidden-gem":
        return <MapPin className="h-4 w-4" />;
      case "relaxation":
        return <Clock className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-lg animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-indigo-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-cyan-400/25 to-blue-400/25 rounded-full blur-xl animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "2s" }}
        ></div>

        {/* Travel Icons Floating */}
        <div className="absolute top-1/4 left-1/4 opacity-10 animate-float">
          <svg
            className="w-16 h-16 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <div
          className="absolute top-3/4 right-1/4 opacity-10 animate-float"
          style={{ animationDelay: "2s" }}
        >
          <svg
            className="w-12 h-12 text-purple-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <div
          className="absolute top-1/2 left-10 opacity-10 animate-float"
          style={{ animationDelay: "4s" }}
        >
          <svg
            className="w-14 h-14 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9.5 4C7.01 4 5 6.01 5 8.5S7.01 13 9.5 13 14 10.99 14 8.5 11.99 4 9.5 4zm0 7C8.12 11 7 9.88 7 8.5S8.12 6 9.5 6s2.5 1.12 2.5 2.5S10.88 11 9.5 11zM21 6h-3.17l-1.24-1.35c-.37-.41-.91-.65-1.47-.65H6.88c-.56 0-1.1.24-1.47.65L4.17 6H1c-.55 0-1 .45-1 1s.45 1 1 1h1.5v11c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V8H23c.55 0 1-.45 1-1s-.45-1-1-1zm-2 13H5V8h14v11z" />
          </svg>
        </div>

        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 animate-gradient-shift"></div>

        {/* Animated Lines */}
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse"></div>
        <div
          className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Floating Particles */}
        <div className="absolute top-10 right-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        <div
          className="absolute top-32 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-50"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-60"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r border-blue-300"></div>
            ))}
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TravelCraft
              </h1>
              <p className="text-sm text-gray-600">
                AI-Powered Travel Planning
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!travelPlan ? (
          /* Planning Form */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Plan Your Perfect Trip
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Create a detailed, personalized travel itinerary with
                activities, dining, and navigation tailored to your budget and
                interests.
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-md travel-card-hover animate-pulse-glow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Trip Details</CardTitle>
                <CardDescription>
                  Tell us about your travel plans and we'll create the perfect
                  itinerary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination City
                  </label>
                  <Input
                    placeholder="e.g., Tokyo, Paris, New York"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Number of Days
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter number of days"
                      min="1"
                      max="30"
                      value={formData.days}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          days: e.target.value,
                        }))
                      }
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget Category
                    </label>
                    <Select
                      value={formData.budgetCategory}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          budgetCategory: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(budgetCategories).map(
                          ([key, category]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {category.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ~${category.dailyAmount}/day ·{" "}
                                  {category.description}
                                </span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Travel Styles (Select multiple)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(travelStyles).map(([key, style]) => (
                      <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={key}
                          checked={formData.travelStyles.includes(key)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              travelStyles: checked
                                ? [...prev.travelStyles, key]
                                : prev.travelStyles.filter((s) => s !== key),
                            }));
                          }}
                        />
                        <label
                          htmlFor={key}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <span className="text-lg">{style.icon}</span>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {style.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {style.description}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateItinerary}
                  disabled={
                    !formData.city ||
                    !formData.days ||
                    !formData.budgetCategory ||
                    formData.travelStyles.length === 0 ||
                    isGenerating
                  }
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      AI is Creating Your Itinerary...
                    </div>
                  ) : (
                    "Generate AI Travel Plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Generated Itinerary */
          <div key={`travel-plan-${travelPlan?.city}-${Date.now()}`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Your {travelPlan.city} Adventure
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {travelPlan.days} days
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {travelPlan.budget} {travelPlan.currency} total budget
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation2 className="h-4 w-4" />
                    {Math.round(travelPlan.budget / travelPlan.days)}{" "}
                    {travelPlan.currency} per day
                  </span>
                  {formData.travelStyles.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {formData.travelStyles.map(style => {
                        const styleInfo = travelStyles[style as keyof typeof travelStyles];
                        return `${styleInfo?.icon} ${styleInfo?.label}`;
                      }).join(', ')} Style{formData.travelStyles.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePlanNewTrip}
                  className="shrink-0 cursor-pointer hover:bg-gray-100"
                  type="button"
                  style={{ pointerEvents: "auto", zIndex: 10 }}
                >
                  Plan New Trip
                </Button>

              </div>
            </div>

            {/* Interactive Map Section */}
            <div className="mb-8">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Travel Locations - {travelPlan.city}
                  </CardTitle>
                  <CardDescription>
                    Explore your travel plan locations with direct links to Google Maps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleMap 
                    city={travelPlan.city}
                    travelPlan={travelPlan}
                    center={getCityCoordinates(travelPlan.city)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              {travelPlan.dailyItinerary.map((day) => (
                <Card
                  key={day.day}
                  className="shadow-xl border-0 bg-white/95 backdrop-blur-md travel-card-hover relative overflow-hidden"
                >
                  <CardHeader className="relative">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-lg"></div>
                    <div className="relative flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-1">
                          Day {day.day}: {day.theme}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {day.summary}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        ~{day.estimatedCost} {travelPlan.currency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="activities" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="activities">Activities</TabsTrigger>
                        <TabsTrigger value="dining">Dining</TabsTrigger>
                        <TabsTrigger value="navigation">Navigation</TabsTrigger>
                        <TabsTrigger value="optional">Optional</TabsTrigger>
                      </TabsList>

                      <TabsContent
                        value="activities"
                        className="space-y-4 mt-6"
                      >
                        <div className="grid gap-4">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <div className="bg-yellow-100 p-1 rounded">
                                ☀️
                              </div>
                              Morning
                            </h4>
                            {day.activities.morning.map((activity, idx) => (
                              <div
                                key={idx}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium flex items-center gap-2">
                                    {getActivityIcon(activity.type)}
                                    {activity.name}
                                  </h5>
                                  <Badge variant="outline">
                                    {activity.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      activity.cost === 0
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {activity.cost === 0
                                      ? "Free"
                                      : `${activity.cost} ${travelPlan.currency}`}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {activity.type.replace("-", " ")}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <div className="bg-blue-100 p-1 rounded">🌅</div>
                              Afternoon
                            </h4>
                            {day.activities.afternoon.map((activity, idx) => (
                              <div
                                key={idx}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium flex items-center gap-2">
                                    {getActivityIcon(activity.type)}
                                    {activity.name}
                                  </h5>
                                  <Badge variant="outline">
                                    {activity.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      activity.cost === 0
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {activity.cost === 0
                                      ? "Free"
                                      : `${activity.cost} ${travelPlan.currency}`}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {activity.type.replace("-", " ")}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <div className="bg-purple-100 p-1 rounded">
                                🌙
                              </div>
                              Evening
                            </h4>
                            {day.activities.evening.map((activity, idx) => (
                              <div
                                key={idx}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium flex items-center gap-2">
                                    {getActivityIcon(activity.type)}
                                    {activity.name}
                                  </h5>
                                  <Badge variant="outline">
                                    {activity.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      activity.cost === 0
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {activity.cost === 0
                                      ? "Free"
                                      : `${activity.cost} ${travelPlan.currency}`}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {activity.type.replace("-", " ")}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="dining" className="space-y-4 mt-6">
                        <div className="grid gap-4">
                          {[
                            {
                              meal: "Breakfast",
                              emoji: "🥐",
                              data: day.dining.breakfast,
                            },
                            {
                              meal: "Lunch",
                              emoji: "🍜",
                              data: day.dining.lunch,
                            },
                            {
                              meal: "Dinner",
                              emoji: "🍽️",
                              data: day.dining.dinner,
                            },
                          ].map(({ meal, emoji, data }) => (
                            <div
                              key={meal}
                              className="border rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium flex items-center gap-2">
                                  <span>{emoji}</span>
                                  {meal}: {data.name}
                                </h5>
                                <Badge variant="secondary">
                                  {data.priceRange}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {data.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{data.cuisine}</Badge>
                                <Badge>
                                  ~{data.estimatedCost} {travelPlan.currency}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="navigation" className="mt-6">
                        <div className="border rounded-lg p-4 bg-blue-50">
                          <h5 className="font-medium flex items-center gap-2 mb-2">
                            <Navigation2 className="h-4 w-4" />
                            Getting Around
                          </h5>
                          <p className="text-gray-700">{day.navigation}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="optional" className="space-y-4 mt-6">
                        <div className="space-y-4">
                          <h5 className="font-medium text-gray-700">
                            Flexible Add-ons (if time and budget allow)
                          </h5>
                          {day.optionalActivities.map((activity, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-4 bg-green-50"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium flex items-center gap-2">
                                  {getActivityIcon(activity.type)}
                                  {activity.name}
                                </h5>
                                <Badge variant="outline">
                                  {activity.duration}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  +{activity.cost} {travelPlan.currency}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {activity.type.replace("-", " ")}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Card */}
            <Card className="mt-8 shadow-lg border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Trip Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {travelPlan.dailyItinerary.reduce(
                        (sum, day) => sum + day.estimatedCost,
                        0,
                      )}
                    </div>
                    <div className="text-sm opacity-90">
                      Total Estimated Cost ({travelPlan.currency})
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {travelPlan.dailyItinerary.reduce(
                        (sum, day) =>
                          sum +
                          day.activities.morning.length +
                          day.activities.afternoon.length +
                          day.activities.evening.length,
                        0,
                      )}
                    </div>
                    <div className="text-sm opacity-90">Total Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {travelPlan.dailyItinerary.reduce(
                        (sum, day) => sum + day.optionalActivities.length,
                        0,
                      )}
                    </div>
                    <div className="text-sm opacity-90">
                      Optional Activities
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

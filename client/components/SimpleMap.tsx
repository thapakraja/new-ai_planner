import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Hotel, Utensils, Camera, Navigation2, Filter, MapIcon, ExternalLink } from 'lucide-react';

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

interface TravelPlan {
  city: string;
  days: number;
  budget: number;
  currency: string;
  dailyItinerary: DayPlan[];
}

interface MapLocation {
  id: string;
  name: string;
  type: 'attraction' | 'hotel' | 'restaurant' | 'transport' | 'shopping' | 'nature';
  description: string;
  rating?: number;
  priceRange?: string;
  openHours?: string;
}

interface SimpleMapProps {
  city: string;
  travelPlan?: TravelPlan;
  center?: [number, number];
}

const SimpleMap: React.FC<SimpleMapProps> = ({
  city,
  travelPlan,
  center = [40.7128, -74.0060]
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>(['attraction', 'hotel', 'restaurant', 'transport']);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [focusedLocation, setFocusedLocation] = useState<MapLocation | null>(null);

  // Generate locations from travel plan
  const locations: MapLocation[] = React.useMemo(() => {
    if (!travelPlan) return [];
    
    const planLocations: MapLocation[] = [];
    let locationId = 1;
    
    travelPlan.dailyItinerary.forEach((day) => {
      // Add activities as attractions
      [...day.activities.morning, ...day.activities.afternoon, ...day.activities.evening].forEach((activity) => {
        planLocations.push({
          id: `activity-${locationId++}`,
          name: activity.name,
          type: 'attraction',
          description: activity.description,
          priceRange: activity.cost === 0 ? 'Free' : `${activity.cost} ${travelPlan.currency}`,
          openHours: activity.duration
        });
      });
      
      // Add dining locations as restaurants
      [day.dining.breakfast, day.dining.lunch, day.dining.dinner].forEach((dining) => {
        if (dining && dining.name) {
          planLocations.push({
            id: `dining-${locationId++}`,
            name: dining.name,
            type: 'restaurant',
            description: `${dining.cuisine} - ${dining.description}`,
            priceRange: dining.priceRange,
            rating: 4.0 + Math.random() * 1.0
          });
        }
      });
    });
    
    // Add essential locations
    planLocations.push({
      id: `hotel-${locationId++}`,
      name: `${city} Accommodation`,
      type: 'hotel',
      description: 'Recommended hotel for your stay',
      rating: 4.5,
      priceRange: 'Varies'
    });
    
    planLocations.push({
      id: `transport-${locationId++}`,
      name: `${city} Transport Hub`,
      type: 'transport',
      description: 'Main transportation center',
      openHours: '24/7'
    });
    
    return planLocations;
  }, [city, travelPlan]);

  const filteredLocations = locations.filter(location => 
    activeFilters.includes(location.type)
  );

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(f => f !== type)
        : [...prev, type]
    );
    // Reset focused location when filters change
    setFocusedLocation(null);
  };

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location);
    setFocusedLocation(location);
  };

  const handleShowAllLocations = () => {
    setFocusedLocation(null);
    setSelectedLocation(null);
  };

  const filterOptions = [
    { type: 'attraction', label: 'Attractions', icon: Camera, color: 'bg-blue-500' },
    { type: 'hotel', label: 'Hotels', icon: Hotel, color: 'bg-green-500' },
    { type: 'restaurant', label: 'Restaurants', icon: Utensils, color: 'bg-yellow-500' },
    { type: 'transport', label: 'Transport', icon: Navigation2, color: 'bg-purple-500' },
  ];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'attraction': return '🏛️';
      case 'hotel': return '🏨';
      case 'restaurant': return '🍽️';
      case 'transport': return '🚌';
      default: return '📍';
    }
  };

  const openInGoogleMaps = (locationName: string) => {
    const query = encodeURIComponent(`${locationName} ${city}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const getEmbedMapUrl = (locationName: string) => {
    const query = encodeURIComponent(`${locationName} ${city}`);
    // Using Google Maps iframe embed - completely free, no API key required
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const getMultiLocationMapUrl = () => {
    // If a specific location is focused, show only that location with custom red pin
    if (focusedLocation) {
      const locationQuery = `${focusedLocation.name}, ${city}`;
      const encodedLocation = encodeURIComponent(locationQuery);
      
      // Use custom red pin icon for focused location
      const customIcon = encodeURIComponent('https://maps.google.com/mapfiles/ms/icons/red-dot.png');
      return `https://maps.google.com/maps?q=${encodedLocation}&markers=icon:${customIcon}%7C${encodedLocation}&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    
    // If no locations, show city center
    if (filteredLocations.length === 0) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(city)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }
    
    // Create multiple markers for all filtered locations with custom pins
    const markers = filteredLocations.slice(0, 8).map((location, index) => {
      const locationQuery = `${location.name}, ${city}`;
      const encodedLocation = encodeURIComponent(locationQuery);
      const customIcon = encodeURIComponent('https://maps.google.com/mapfiles/ms/icons/red-dot.png');
      return `markers=icon:${customIcon}%7Clabel:${index + 1}%7C${encodedLocation}`;
    }).join('&');
    
    // Center on first location with all markers
    const centerLocation = encodeURIComponent(`${filteredLocations[0].name}, ${city}`);
    return `https://maps.google.com/maps?q=${centerLocation}&${markers}&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'attraction': return 'blue';
      case 'hotel': return 'green';
      case 'restaurant': return 'red';
      case 'transport': return 'purple';
      default: return 'red';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Location Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant={activeFilters.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(type)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
                <Badge variant="secondary" className="ml-1">
                  {locations.filter(l => l.type === type).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Google Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Interactive Map - {city}
                  {focusedLocation && (
                    <Badge variant="secondary" className="ml-2">
                      Focused: {focusedLocation.name}
                    </Badge>
                  )}
                </div>
                {focusedLocation && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleShowAllLocations}
                  >
                    Show All Locations
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[500px] rounded-lg overflow-hidden">
                <iframe
                  src={getMultiLocationMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Interactive map of ${city} with travel locations`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location List Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Travel Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      focusedLocation?.id === location.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="text-xl">{getLocationIcon(location.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{location.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{location.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {location.type}
                        </Badge>
                        {location.rating && (
                          <span className="text-xs text-yellow-600">⭐ {location.rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(location.name);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {filteredLocations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No locations found for selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Hotel, Utensils, Camera, Navigation2, Filter, MapIcon } from 'lucide-react';

// Fix for default markers in React-Leaflet
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (error) {
  console.warn('Leaflet icon setup failed:', error);
}

// Custom marker icons
const createCustomIcon = (color: string, iconName: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">
        ${iconName}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const markerIcons = {
  attraction: createCustomIcon('#3B82F6', '🏛️'),
  hotel: createCustomIcon('#10B981', '🏨'),
  restaurant: createCustomIcon('#F59E0B', '🍽️'),
  transport: createCustomIcon('#8B5CF6', '🚌'),
  shopping: createCustomIcon('#EC4899', '🛍️'),
  nature: createCustomIcon('#059669', '🌳'),
};

interface MapLocation {
  id: string;
  name: string;
  type: 'attraction' | 'hotel' | 'restaurant' | 'transport' | 'shopping' | 'nature';
  lat: number;
  lng: number;
  description: string;
  rating?: number;
  priceRange?: string;
  openHours?: string;
  website?: string;
  phone?: string;
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

interface TravelMapProps {
  city: string;
  travelPlan?: TravelPlan;
  locations?: MapLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Component to handle map centering
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const TravelMap: React.FC<TravelMapProps> = ({
  city,
  travelPlan,
  locations = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  height = '500px'
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>(['attraction', 'hotel', 'restaurant', 'transport', 'shopping', 'nature']);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  }, []);

  // Generate locations from travel plan activities
  const travelPlanLocations: MapLocation[] = useMemo(() => {
    if (!travelPlan || locations.length > 0) return locations;
    
    const planLocations: MapLocation[] = [];
    let locationId = 1;
    
    travelPlan.dailyItinerary.forEach((day) => {
      // Add activities as attractions
      [...day.activities.morning, ...day.activities.afternoon, ...day.activities.evening].forEach((activity) => {
        planLocations.push({
          id: `activity-${locationId++}`,
          name: activity.name,
          type: activity.type === 'culture' ? 'attraction' : 'attraction',
          description: activity.description,
          lat: center[0] + (Math.random() - 0.5) * 0.02,
          lng: center[1] + (Math.random() - 0.5) * 0.02,
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
            lat: center[0] + (Math.random() - 0.5) * 0.02,
            lng: center[1] + (Math.random() - 0.5) * 0.02,
            priceRange: dining.priceRange,
            rating: 4.0 + Math.random() * 1.0
          });
        }
      });
    });
    
    // Add some essential locations
    planLocations.push({
      id: `hotel-${locationId++}`,
      name: `${city} Accommodation`,
      type: 'hotel',
      description: 'Recommended hotel for your stay',
      lat: center[0] + (Math.random() - 0.5) * 0.01,
      lng: center[1] + (Math.random() - 0.5) * 0.01,
      rating: 4.5,
      priceRange: 'Varies'
    });
    
    planLocations.push({
      id: `transport-${locationId++}`,
      name: `${city} Transport Hub`,
      type: 'transport',
      description: 'Main transportation center',
      lat: center[0] + (Math.random() - 0.5) * 0.015,
      lng: center[1] + (Math.random() - 0.5) * 0.015,
      openHours: '24/7'
    });
    
    return planLocations;
  }, [city, center, locations, travelPlan]);

  const filteredLocations = travelPlanLocations.filter(location => 
    activeFilters.includes(location.type)
  );

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(f => f !== type)
        : [...prev, type]
    );
  };

  const filterOptions = [
    { type: 'attraction', label: 'Attractions', icon: Camera, color: 'bg-blue-500' },
    { type: 'hotel', label: 'Hotels', icon: Hotel, color: 'bg-green-500' },
    { type: 'restaurant', label: 'Restaurants', icon: Utensils, color: 'bg-yellow-500' },
    { type: 'transport', label: 'Transport', icon: Navigation2, color: 'bg-purple-500' },
    { type: 'shopping', label: 'Shopping', icon: MapPin, color: 'bg-pink-500' },
    { type: 'nature', label: 'Nature', icon: MapIcon, color: 'bg-emerald-500' },
  ];

  // Error boundary for map
  if (mapError) {
    return (
      <div className="w-full space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Map Unavailable</h3>
            <p className="text-gray-600 mb-4">Unable to load the interactive map. Here are your travel locations:</p>
            <div className="grid gap-2 max-w-md mx-auto">
              {travelPlanLocations.slice(0, 5).map((location) => (
                <div key={location.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>{location.type === 'attraction' ? '🏛️' : location.type === 'restaurant' ? '🍽️' : location.type === 'hotel' ? '🏨' : '📍'}</span>
                  <span className="text-sm">{location.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Map Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(({ type, label, icon: Icon, color }) => (
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
                  {travelPlanLocations.filter(l => l.type === type).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div style={{ height, width: '100%' }}>
                {typeof window !== 'undefined' ? (
                  <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                    whenReady={() => setIsMapLoaded(true)}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapController center={center} zoom={zoom} />
                    
                    {/* User location marker */}
                    {userLocation && (
                      <Marker 
                        position={userLocation}
                        icon={createCustomIcon('#EF4444', '📍')}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>Your Location</strong>
                            <p>Current position</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Location markers */}
                    {filteredLocations.map((location) => (
                      <Marker
                        key={location.id}
                        position={[location.lat, location.lng]}
                        icon={markerIcons[location.type]}
                        eventHandlers={{
                          click: () => setSelectedLocation(location),
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <h3 className="font-semibold text-lg mb-2">{location.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                            
                            {location.rating && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm">{location.rating}/5</span>
                              </div>
                            )}
                            
                            {location.priceRange && (
                              <p className="text-sm text-green-600 mb-1">💰 {location.priceRange}</p>
                            )}
                            
                            {location.openHours && (
                              <p className="text-sm text-blue-600 mb-1">🕒 {location.openHours}</p>
                            )}
                            
                            {location.phone && (
                              <p className="text-sm text-gray-600">📞 {location.phone}</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Details Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLocation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {selectedLocation.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{selectedLocation.description}</p>
                  
                  <div className="space-y-2">
                    {selectedLocation.rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span>{selectedLocation.rating}/5 Rating</span>
                      </div>
                    )}
                    
                    {selectedLocation.priceRange && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">💰</span>
                        <span>{selectedLocation.priceRange}</span>
                      </div>
                    )}
                    
                    {selectedLocation.openHours && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">🕒</span>
                        <span>{selectedLocation.openHours}</span>
                      </div>
                    )}
                    
                    {selectedLocation.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📞</span>
                        <span>{selectedLocation.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <Button className="w-full" size="sm">
                      Get Directions
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      Add to Itinerary
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a map marker to view location details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TravelMap;

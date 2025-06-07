
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, MapPin, Users, ChefHat, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { MenuWithServiceOptions, MenuWithReviews, CreateEventRequestInput, ServiceOption } from '../../server/src/schema';

type ViewState = 'menu-list' | 'menu-detail' | 'event-config' | 'confirmation';

interface EventFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_date: string;
  event_time: string;
  location: string;
  guest_count: number;
  special_requests: string | null;
  dietary_restrictions: string | null;
  service_option_id: number | null;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('menu-list');
  const [menus, setMenus] = useState<MenuWithServiceOptions[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuWithReviews | null>(null);
  const [eventFormData, setEventFormData] = useState<EventFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: null,
    event_date: '',
    event_time: '',
    location: '',
    guest_count: 1,
    special_requests: null,
    dietary_restrictions: null,
    service_option_id: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventRequestId, setEventRequestId] = useState<number | null>(null);

  const loadMenus = useCallback(async () => {
    try {
      const result = await trpc.getMenus.query();
      setMenus(result);
    } catch (err) {
      console.error('Failed to load menus:', err);
      setError('Failed to load menus');
    }
  }, []);

  const loadMenuDetail = useCallback(async (menuId: number) => {
    try {
      setIsLoading(true);
      const result = await trpc.getMenuById.query({ id: menuId });
      if (result) {
        setSelectedMenu(result);
        setCurrentView('menu-detail');
      }
    } catch (err) {
      console.error('Failed to load menu details:', err);
      setError('Failed to load menu details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const handleMenuSelect = (menu: MenuWithServiceOptions) => {
    loadMenuDetail(menu.id);
  };

  const handleStartEventConfig = () => {
    if (selectedMenu) {
      setEventFormData(prev => ({
        ...prev,
        menu_id: selectedMenu.id
      }));
      setCurrentView('event-config');
    }
  };

  const calculateTotalPrice = (): number => {
    if (!selectedMenu || !eventFormData.service_option_id) return 0;
    
    const serviceOption = selectedMenu.service_options.find(
      (opt: ServiceOption) => opt.id === eventFormData.service_option_id
    );
    
    return serviceOption ? serviceOption.price_per_person * eventFormData.guest_count : 0;
  };

  const handleSubmitEventRequest = async () => {
    if (!selectedMenu || !eventFormData.service_option_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestData: CreateEventRequestInput = {
        customer_name: eventFormData.customer_name,
        customer_email: eventFormData.customer_email,
        customer_phone: eventFormData.customer_phone,
        menu_id: selectedMenu.id,
        service_option_id: eventFormData.service_option_id,
        event_date: new Date(eventFormData.event_date),
        event_time: eventFormData.event_time,
        location: eventFormData.location,
        guest_count: eventFormData.guest_count,
        special_requests: eventFormData.special_requests,
        dietary_restrictions: eventFormData.dietary_restrictions
      };

      const result = await trpc.createEventRequest.mutate(requestData);
      setEventRequestId(result.id);
      setCurrentView('confirmation');
    } catch (err) {
      console.error('Failed to create event request:', err);
      setError('Failed to submit event request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToMenuList = () => {
    setCurrentView('menu-list');
    setSelectedMenu(null);
    setEventFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: null,
      event_date: '',
      event_time: '',
      location: '',
      guest_count: 1,
      special_requests: null,
      dietary_restrictions: null,
      service_option_id: null
    });
    setError(null);
    setEventRequestId(null);
  };

  const renderMenuList = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-12 w-12 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Chef's Table</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover exceptional culinary experiences with our curated menus and personalized service options
          </p>
        </div>

        {error && (
          <Alert className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {menus.map((menu: MenuWithServiceOptions) => (
            <Card 
              key={menu.id} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 shadow-lg"
              onClick={() => handleMenuSelect(menu)}
            >
              <div className="relative overflow-hidden rounded-t-lg">
                {menu.thumbnail_image_url ? (
                  <img 
                    src={menu.thumbnail_image_url} 
                    alt={menu.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center">
                    <ChefHat className="h-16 w-16 text-orange-600" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    From ${menu.min_price || 0}/person
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">{menu.name}</CardTitle>
                {menu.description && (
                  <CardDescription className="text-gray-600 line-clamp-2">
                    {menu.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {menu.average_rating && (
                      <>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {menu.average_rating.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {menu.service_options.length} service option{menu.service_options.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenuDetail = () => {
    if (!selectedMenu) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('menu-list')}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menus
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0">
              <div className="relative">
                {selectedMenu.thumbnail_image_url ? (
                  <img 
                    src={selectedMenu.thumbnail_image_url} 
                    alt={selectedMenu.name}
                    className="w-full h-64 md:h-80 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-64 md:h-80 bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center rounded-t-lg">
                    <ChefHat className="h-24 w-24 text-orange-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-lg" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{selectedMenu.name}</h1>
                  {selectedMenu.average_rating && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-medium">
                        {selectedMenu.average_rating.toFixed(1)} ({selectedMenu.reviews.length} review{selectedMenu.reviews.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-8">
                {selectedMenu.description && (
                  <div className="mb-8">
                    <p className="text-lg text-gray-700 leading-relaxed">{selectedMenu.description}</p>
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Service Options</h2>
                  <div className="grid gap-6">
                    {selectedMenu.service_options.map((option: ServiceOption) => (
                      <Card key={option.id} className="border-2 hover:border-orange-300 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800 capitalize mb-2">
                                {option.service_type.replace('-', ' ')} Service
                              </h3>
                              {option.description && (
                                <p className="text-gray-600">{option.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-orange-600">
                                ${option.price_per_person}
                              </div>
                              <div className="text-sm text-gray-500">per person</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={handleStartEventConfig}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
                  >
                    Book This Menu
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderEventConfig = () => {
    if (!selectedMenu) return null;

    const selectedServiceOption = selectedMenu.service_options.find(
      (opt: ServiceOption) => opt.id === eventFormData.service_option_id
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('menu-detail')}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Configure Your Event</CardTitle>
                <CardDescription className="text-orange-100">
                  {selectedMenu.name} - Let's plan your perfect culinary experience
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8">
                {error && (
                  <Alert className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="customer_name" className="text-base font-medium">Your Name *</Label>
                      <Input
                        id="customer_name"
                        value={eventFormData.customer_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEventFormData((prev: EventFormData) => ({ ...prev, customer_name: e.target.value }))
                        }
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_email" className="text-base font-medium">Email Address *</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={eventFormData.customer_email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEventFormData((prev: EventFormData) => ({ ...prev, customer_email: e.target.value }))
                        }
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_phone" className="text-base font-medium">Phone Number</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={eventFormData.customer_phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEventFormData((prev: EventFormData) => ({ 
                            ...prev, 
                            customer_phone: e.target.value || null 
                          }))
                        }
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_date" className="text-base font-medium">Event Date *</Label>
                        <Input
                          id="event_date"
                          type="date"
                          value={eventFormData.event_date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEventFormData((prev: EventFormData) => ({ ...prev, event_date: e.target.value }))
                          }
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event_time" className="text-base font-medium">Event Time *</Label>
                        <Input
                          id="event_time"
                          type="time"
                          value={eventFormData.event_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEventFormData((prev: EventFormData) => ({ ...prev, event_time: e.target.value }))
                          }
                          className="mt-2"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="location" className="text-base font-medium">Event Location *</Label>
                      <Input
                        id="location"
                        value={eventFormData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEventFormData((prev: EventFormData) => ({ ...prev, location: e.target.value }))
                        }
                        className="mt-2"
                        placeholder="Full address or venue name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="guest_count" className="text-base font-medium">Number of Guests *</Label>
                      <Input
                        id="guest_count"
                        type="number"
                        min="1"
                        value={eventFormData.guest_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEventFormData((prev: EventFormData) => ({ 
                            ...prev, 
                            guest_count: parseInt(e.target.value) || 1 
                          }))
                        }
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="service_type" className="text-base font-medium">Service Type *</Label>
                      <Select
                        value={eventFormData.service_option_id?.toString() || ''}
                        onValueChange={(value: string) =>
                          setEventFormData((prev: EventFormData) => ({ 
                            ...prev, 
                            service_option_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose your service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMenu.service_options.map((option: ServiceOption) => (
                            <SelectItem key={option.id} value={option.id.toString()}>
                              <div className="flex justify-between items-center w-full">
                                <span className="capitalize">{option.service_type.replace('-', ' ')} Service</span>
                                <span className="ml-4 font-semibold">${option.price_per_person}/person</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="special_requests" className="text-base font-medium">Special Requests</Label>
                      <Textarea
                        id="special_requests"
                        value={eventFormData.special_requests || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEventFormData((prev: EventFormData) => ({ 
                            ...prev, 
                            special_requests: e.target.value || null 
                          }))
                        }
                        className="mt-2"
                        rows={3}
                        placeholder="Any special requests or preferences?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dietary_restrictions" className="text-base font-medium">Dietary Restrictions</Label>
                      <Textarea
                        id="dietary_restrictions"
                        value={eventFormData.dietary_restrictions || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEventFormData((prev: EventFormData) => ({ 
                            ...prev, 
                            dietary_restrictions: e.target.value || null 
                          }))
                        }
                        className="mt-2"
                        rows={3}
                        placeholder="Please list any allergies or dietary restrictions"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{eventFormData.event_date || 'Date not selected'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{eventFormData.event_time || 'Time not selected'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{eventFormData.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{eventFormData.guest_count} guest{eventFormData.guest_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  {selectedServiceOption && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800 capitalize">
                            {selectedServiceOption.service_type.replace('-', ' ')} Service
                          </div>
                          <div className="text-sm text-gray-600">
                            ${selectedServiceOption.price_per_person} × {eventFormData.guest_count} guests
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          ${calculateTotalPrice().toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={handleSubmitEventRequest}
                    disabled={
                      isLoading || 
                      !eventFormData.customer_name || 
                      !eventFormData.customer_email || 
                      !eventFormData.event_date || 
                      !eventFormData.event_time || 
                      !eventFormData.location || 
                      !eventFormData.service_option_id
                    }
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Event Request'}
                    {!isLoading && <ArrowRight className="h-5 w-5 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-0 text-center">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Request Submitted!</h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your event request! We've received your details and our chef will review your request shortly.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Our chef will review your event details and menu selection</p>
                <p>2. You'll receive an email confirmation within 24 hours</p>
                <p>3. Once approved, you'll get a secure checkout link to complete your booking</p>
                <p>4. We'll send you final event details and preparation instructions</p>
              </div>
            </div>
            
            {eventRequestId && (
              <p className="text-sm text-gray-500 mb-6">
                Your request ID: #{eventRequestId}
              </p>
            )}
            
            <Button 
              onClick={resetToMenuList}
              variant="outline"
              size="lg"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              Browse More Menus
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isLoading && currentView === 'menu-detail') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading menu details...</p>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case 'menu-list':
      return renderMenuList();
    case 'menu-detail':
      return renderMenuDetail();
    case 'event-config':
      return renderEventConfig();
    case 'confirmation':
      return renderConfirmation();
    default:
      return renderMenuList();
  }
}

export default App;


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { MenuWithReviews, ServiceOption, CreateEventRequestInput } from '../../../server/src/schema';

interface EventRequestFlowProps {
  menu: MenuWithReviews;
  onComplete: () => void;
}

type FlowStep = 'details' | 'confirmation' | 'submitted';

export function EventRequestFlow({ menu, onComplete }: EventRequestFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServiceOption, setSelectedServiceOption] = useState<ServiceOption | null>(
    menu.service_options.length > 0 ? menu.service_options[0] : null
  );
  
  const [formData, setFormData] = useState<CreateEventRequestInput>({
    customer_name: '',
    customer_email: '',
    customer_phone: null,
    menu_id: menu.id,
    service_option_id: selectedServiceOption?.id || 0,
    event_date: new Date(),
    event_time: '',
    location: '',
    guest_count: 1,
    special_requests: null,
    dietary_restrictions: null
  });

  const handleServiceOptionChange = (serviceOptionId: string) => {
    const option = menu.service_options.find(opt => opt.id === parseInt(serviceOptionId));
    if (option) {
      setSelectedServiceOption(option);
      setFormData((prev: CreateEventRequestInput) => ({
        ...prev,
        service_option_id: option.id
      }));
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedServiceOption) return 0;
    return selectedServiceOption.price_per_person * formData.guest_count;
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'plated': return 'Plated Service';
      case 'buffet': return 'Buffet Style';
      case 'cook-along': return 'Cook-Along Class';
      default: return serviceType;
    }
  };

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'plated': return '🍽️';
      case 'buffet': return '🥘';
      case 'cook-along': return '👨‍🍳';
      default: return '🍴';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 'details') {
      setCurrentStep('confirmation');
      return;
    }
    
    if (currentStep === 'confirmation') {
      setIsSubmitting(true);
      try {
        await trpc.createEventRequest.mutate(formData);
        setCurrentStep('submitted');
      } catch (error) {
        console.error('Failed to submit event request:', error);
        alert('Failed to submit your request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'confirmation') {
      setCurrentStep('details');
    }
  };

  if (currentStep === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-8">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">Request Submitted Successfully!</h2>
            <p className="text-green-700 mb-6 leading-relaxed">
              Thank you for your event request! We've received your details and our chef will review your request shortly. 
              You'll receive an email confirmation with next steps.
            </p>
            <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Our chef will review your request within 24 hours</li>
                <li>• If accepted, you'll receive a checkout link via email</li>
                <li>• Complete payment to confirm your event</li>
                <li>• We'll contact you to finalize all details</li>
              </ul>
            </div>
            <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
              Browse More Menus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Event</h1>
        <p className="text-gray-600">Complete the details below to request your culinary experience</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'details' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 'details' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <span className="font-medium">Event Details</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 'confirmation' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {currentStep === 'details' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Full Name *</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateEventRequestInput) => ({ ...prev, customer_name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Email Address *</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={formData.customer_email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateEventRequestInput) => ({ ...prev, customer_email: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Phone Number (Optional)</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={formData.customer_phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEventRequestInput) => ({ 
                            ...prev, 
                            customer_phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Event Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>Event Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_date">Event Date *</Label>
                        <Input
                          id="event_date"
                          type="date"
                          value={formData.event_date.toISOString().split('T')[0]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateEventRequestInput) => ({ 
                              ...prev, 
                              event_date: new Date(e.target.value) 
                            }))
                          }
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event_time">Event Time *</Label>
                        <Input
                          id="event_time"
                          type="time"
                          value={formData.event_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateEventRequestInput) => ({ ...prev, event_time: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Event Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEventRequestInput) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="Full address or venue name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_count">Number of Guests *</Label>
                      <Input
                        id="guest_count"
                        type="number"
                        min="1"
                        value={formData.guest_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEventRequestInput) => ({ 
                            ...prev, 
                            guest_count: parseInt(e.target.value) || 1 
                          }))
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Service Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>🍽️</span>
                      <span>Service Type</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="service_option">Choose Service Type *</Label>
                    <Select
                      value={selectedServiceOption?.id.toString() || ''}
                      onValueChange={handleServiceOptionChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {menu.service_options.map((option: ServiceOption) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span>{getServiceTypeIcon(option.service_type)}</span>
                              <span>{getServiceTypeLabel(option.service_type)}</span>
                              <span className="text-sm text-gray-500">
                                (${option.price_per_person.toFixed(2)}/person)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Additional Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>📝</span>
                      <span>Additional Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="special_requests">Special Requests</Label>
                      <Textarea
                        id="special_requests"
                        value={formData.special_requests || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateEventRequestInput) => ({ 
                            ...prev, 
                            special_requests: e.target.value || null 
                          }))
                        }
                        placeholder="Any special requests or preferences for your event..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                      <Textarea
                        id="dietary_restrictions"
                        value={formData.dietary_restrictions || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateEventRequestInput) => ({ 
                            ...prev, 
                            dietary_restrictions: e.target.value || null 
                          }))
                        }
                        placeholder="Please list any allergies or dietary restrictions..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Confirm Your Request</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <p className="text-gray-600">
                      <strong>{formData.customer_name}</strong><br />
                      {formData.customer_email}
                      {formData.customer_phone && <><br />{formData.customer_phone}</>}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                    <p className="text-gray-600">
                      <strong>Date:</strong> {formData.event_date.toLocaleDateString()}<br />
                      <strong>Time:</strong> {formData.event_time}<br />
                      <strong>Location:</strong> {formData.location}<br />
                      <strong>Guests:</strong> {formData.guest_count}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Menu & Service</h3>
                    <p className="text-gray-600">
                      <strong>Menu:</strong> {menu.name}<br />
                      <strong>Service:</strong> {selectedServiceOption && getServiceTypeLabel(selectedServiceOption.service_type)}
                    </p>
                  </div>
                  
                  {(formData.special_requests || formData.dietary_restrictions) && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                        {formData.special_requests && (
                          <p className="text-gray-600 mb-2">
                            <strong>Special Requests:</strong> {formData.special_requests}
                          </p>
                        )}
                        {formData.dietary_restrictions && (
                          <p className="text-gray-600">
                            <strong>Dietary Restrictions:</strong> {formData.dietary_restrictions}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                  {selectedServiceOption && (
                    <p className="text-sm text-gray-600">
                      {getServiceTypeLabel(selectedServiceOption.service_type)}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per person:</span>
                    <span>${selectedServiceOption?.price_per_person.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of guests:</span>
                    <span>{formData.guest_count}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Estimate:</span>
                  <span className="text-orange-600">${calculateTotalPrice().toFixed(2)}</span>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    💡 This is an estimate. Final pricing will be confirmed by the chef.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <div>
            {currentStep === 'confirmation' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="px-6"
              >
                ← Back to Details
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : currentStep === 'details' ? (
              'Review Request →'
            ) : (
              'Submit Request 🍽️'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

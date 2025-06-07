
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { MenuWithServiceOptions, MenuWithReviews, ServiceOption } from '../../../server/src/schema';

interface MenuDetailProps {
  menu: MenuWithServiceOptions;
  onStartEventRequest: (menu: MenuWithReviews) => void;
}

export function MenuDetail({ menu, onStartEventRequest }: MenuDetailProps) {
  const [detailedMenu, setDetailedMenu] = useState<MenuWithReviews | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceOption, setSelectedServiceOption] = useState<ServiceOption | null>(null);

  const loadMenuDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMenuById.query({ id: menu.id });
      if (result) {
        setDetailedMenu(result);
        // Auto-select the first service option
        if (result.service_options.length > 0) {
          setSelectedServiceOption(result.service_options[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load menu details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [menu.id]);

  useEffect(() => {
    loadMenuDetails();
  }, [loadMenuDetails]);

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'plated': return 'Plated Service';
      case 'buffet': return 'Buffet Style';
      case 'cook-along': return 'Cook-Along Class';
      default: return serviceType;
    }
  };

  const getServiceTypeDescription = (serviceType: string) => {
    switch (serviceType) {
      case 'plated': return 'Elegant individually plated meals served to your guests';
      case 'buffet': return 'Self-service buffet with a variety of dishes';
      case 'cook-along': return 'Interactive cooking experience with our chef';
      default: return 'Professional catering service';
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

  const formatRating = (rating: number | null) => {
    if (rating === null) return 'New Menu';
    return `⭐ ${rating.toFixed(1)} average rating`;
  };

  const handleRequestEvent = () => {
    if (detailedMenu) {
      onStartEventRequest(detailedMenu);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Skeleton className="aspect-square w-full rounded-lg mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!detailedMenu) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Menu Not Found</h3>
          <p className="text-red-600">Sorry, we couldn't load this menu's details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Menu Image and Basic Info */}
        <div>
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg mb-6 overflow-hidden">
            {detailedMenu.thumbnail_image_url ? (
              <img 
                src={detailedMenu.thumbnail_image_url} 
                alt={detailedMenu.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl text-orange-300">🍴</div>
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{detailedMenu.name}</h1>
            <p className="text-gray-600 mb-4">{formatRating(detailedMenu.average_rating)}</p>
            {detailedMenu.description && (
              <p className="text-gray-700 leading-relaxed">{detailedMenu.description}</p>
            )}
          </div>
        </div>

        {/* Service Options */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Options</h2>
          
          <div className="space-y-4 mb-6">
            {detailedMenu.service_options.map((option: ServiceOption) => (
              <Card 
                key={option.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedServiceOption?.id === option.id 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'hover:border-orange-300'
                }`}
                onClick={() => setSelectedServiceOption(option)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getServiceTypeIcon(option.service_type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {getServiceTypeLabel(option.service_type)}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {getServiceTypeDescription(option.service_type)}
                        </p>
                        {option.description && (
                          <p className="text-sm text-gray-700">{option.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">
                        ${option.price_per_person.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">per person</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handleRequestEvent}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
            disabled={!selectedServiceOption}
          >
            Request This Menu 🍽️
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      {detailedMenu.reviews.length > 0 && (
        <div>
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detailedMenu.reviews.slice(0, 4).map((review) => (
              <Card key={review.id} className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium text-gray-900">
                        {review.customer_name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {review.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {'⭐'.repeat(review.rating)}
                    </Badge>
                  </div>
                </CardHeader>
                {review.comment && (
                  <CardContent className="pt-0">
                    <p className="text-gray-700 text-sm leading-relaxed">"{review.comment}"</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          
          {detailedMenu.reviews.length > 4 && (
            <p className="text-center text-gray-500 mt-6">
              And {detailedMenu.reviews.length - 4} more reviews...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

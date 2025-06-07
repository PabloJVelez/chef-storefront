
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { MenuWithServiceOptions } from '../../../server/src/schema';

interface MenuListProps {
  onMenuSelect: (menu: MenuWithServiceOptions) => void;
}

export function MenuList({ onMenuSelect }: MenuListProps) {
  const [menus, setMenus] = useState<MenuWithServiceOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getMenus.query();
      setMenus(result);
    } catch (err) {
      console.error('Failed to load menus:', err);
      setError('Failed to load menus. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Price on request';
    return `$${price.toFixed(2)}`;
  };

  const formatRating = (rating: number | null) => {
    if (rating === null) return 'New';
    return `⭐ ${rating.toFixed(1)}`;
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Menus</h2>
          <p className="text-gray-600">Choose from our carefully crafted culinary experiences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video">
                <Skeleton className="w-full h-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Menus</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadMenus}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Menus Available</h3>
          <p className="text-gray-600">Check back soon for our delicious offerings!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Menus</h2>
        <p className="text-gray-600">Choose from our carefully crafted culinary experiences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu: MenuWithServiceOptions) => (
          <Card 
            key={menu.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
            onClick={() => onMenuSelect(menu)}
          >
            <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center relative overflow-hidden">
              {menu.thumbnail_image_url ? (
                <img 
                  src={menu.thumbnail_image_url} 
                  alt={menu.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-6xl text-orange-300">🍴</div>
              )}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-white/90 text-gray-700">
                  {formatRating(menu.average_rating)}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                {menu.name}
              </CardTitle>
              {menu.description && (
                <p className="text-gray-600 text-sm line-clamp-2">{menu.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatPrice(menu.min_price)}
                    <span className="text-sm font-normal text-gray-500">/person</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {menu.service_options.length} service{menu.service_options.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400">available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

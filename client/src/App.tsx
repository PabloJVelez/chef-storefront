
import { useState } from 'react';
import { MenuList } from '@/components/MenuList';
import { MenuDetail } from '@/components/MenuDetail';
import { EventRequestFlow } from '@/components/EventRequestFlow';
import type { MenuWithServiceOptions, MenuWithReviews } from '../../server/src/schema';

type AppState = 'menu-list' | 'menu-detail' | 'event-request';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('menu-list');
  const [selectedMenu, setSelectedMenu] = useState<MenuWithServiceOptions | null>(null);
  const [detailedMenu, setDetailedMenu] = useState<MenuWithReviews | null>(null);

  const handleMenuSelect = (menu: MenuWithServiceOptions) => {
    setSelectedMenu(menu);
    setDetailedMenu(null); // Reset detailed menu when selecting a new menu
    setCurrentState('menu-detail');
  };

  const handleBackToMenus = () => {
    setSelectedMenu(null);
    setDetailedMenu(null);
    setCurrentState('menu-list');
  };

  const handleStartEventRequest = (menu: MenuWithReviews) => {
    setDetailedMenu(menu);
    setCurrentState('event-request');
  };

  const handleEventRequestComplete = () => {
    setCurrentState('menu-list');
    setSelectedMenu(null);
    setDetailedMenu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-2 rounded-lg">
                👨‍🍳
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chef's Table</h1>
                <p className="text-gray-600">Exceptional culinary experiences</p>
              </div>
            </div>
            {currentState !== 'menu-list' && (
              <button
                onClick={handleBackToMenus}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                ← Back to Menus
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentState === 'menu-list' && (
          <MenuList onMenuSelect={handleMenuSelect} />
        )}
        
        {currentState === 'menu-detail' && selectedMenu && (
          <MenuDetail
            menu={selectedMenu}
            onStartEventRequest={handleStartEventRequest}
          />
        )}
        
        {currentState === 'event-request' && detailedMenu && (
          <EventRequestFlow
            menu={detailedMenu}
            onComplete={handleEventRequestComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;

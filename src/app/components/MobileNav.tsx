import { Home, Map, MessageCircle, User } from 'lucide-react';

interface MobileNavProps {
  active: 'home' | 'map' | 'chat' | 'profile';
}

export function MobileNav({ active }: MobileNavProps) {
  const items = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'map', label: 'Carte', icon: Map },
    { id: 'chat', label: 'DrGabès', icon: MessageCircle },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around px-4 py-3 md:hidden"
      style={{ borderColor: 'rgba(28, 28, 30, 0.15)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        
        return (
          <button
            key={item.id}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
            style={{
              backgroundColor: isActive ? '#E8F5EE' : 'transparent',
              color: isActive ? '#1A6B47' : '#8A8A8E'
            }}
          >
            <Icon size={20} />
            <span 
              className="text-xs"
              style={{ 
                fontFamily: 'var(--font-ibm-sans)',
                fontWeight: isActive ? 500 : 400
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

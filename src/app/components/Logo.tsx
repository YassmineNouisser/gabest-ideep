import { Plus, Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'md', showTagline = false, className = '', variant = 'light' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-4xl' }
  };

  const currentSize = sizes[size];

  const textColor = variant === 'dark' ? 'white' : '#1C1C1E';
  const taglineColor = variant === 'dark' ? 'rgba(255,255,255,0.7)' : '#8A8A8E';

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-3">
        {/* Stylized medical cross with palm leaf */}
        <div className="relative" style={{ width: currentSize.icon, height: currentSize.icon }}>
          <Plus
            size={currentSize.icon}
            className="absolute inset-0"
            style={{ color: '#1A6B47' }}
            strokeWidth={3}
          />
          <Leaf
            size={currentSize.icon * 0.6}
            className="absolute"
            style={{
              color: '#C8973A',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        <div>
          <div
            className={currentSize.text}
            style={{
              fontFamily: 'var(--font-playfair)',
              fontWeight: 700,
              color: textColor
            }}
          >
            Gabest
          </div>
        </div>
      </div>

      {showTagline && (
        <div
          className="mt-2 text-sm"
          style={{
            fontFamily: 'var(--font-naskh)',
            color: taglineColor,
            direction: 'rtl'
          }}
        >
          من الأرض إلى الصحة
        </div>
      )}
    </div>
  );
}

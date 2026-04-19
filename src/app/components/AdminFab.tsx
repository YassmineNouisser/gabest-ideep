import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router';

export function AdminFab() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/dashboard/admin')}
      title="Console admin"
      aria-label="Console admin"
      className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-[1.06]"
      style={{
        backgroundColor: '#0F1A13',
        color: 'white',
        boxShadow:
          '0 10px 30px rgba(15,26,19,0.25), 0 0 0 1px rgba(255,255,255,0.08)'
      }}
    >
      <Shield size={16} strokeWidth={2.2} />
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
        style={{
          backgroundColor: '#2BA24C',
          border: '2px solid #F7F5F0',
          boxShadow: '0 0 8px rgba(43,162,76,0.55)'
        }}
      />
    </button>
  );
}

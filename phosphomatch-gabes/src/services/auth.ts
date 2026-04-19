import type { Seller, SignupData } from '../types';

const SELLERS_KEY = 'sellers';
const CURRENT_SELLER_KEY = 'current_seller';

interface StoredSeller extends Seller {
  password_hash: string;
}

export interface LoginResult {
  seller: Seller | null;
  error?: string;
}

function createId(): string {
  return crypto.randomUUID();
}

function encodePassword(password: string): string {
  // TODO: Replace demo btoa hashing with backend bcrypt or Argon2 + JWT/session cookies.
  return btoa(unescape(encodeURIComponent(password)));
}

function toPublicSeller(seller: StoredSeller): Seller {
  const { password_hash: _passwordHash, ...publicSeller } = seller;
  return publicSeller;
}

function readStoredSellers(): StoredSeller[] {
  const raw = localStorage.getItem(SELLERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredSeller[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredSellers(sellers: StoredSeller[]): void {
  localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers));
}

function setCurrentSeller(seller: Seller): void {
  localStorage.setItem(CURRENT_SELLER_KEY, JSON.stringify(seller));
}

export function seedDemoAccount(): void {
  const sellers = readStoredSellers();
  if (sellers.some((seller) => seller.email.toLowerCase() === 'demo@gct.tn')) return;

  const demo: StoredSeller = {
    id: createId(),
    email: 'demo@gct.tn',
    password_hash: encodePassword('demo123'),
    company_name: 'Groupe Chimique Tunisien',
    location: 'Gabès, Tunisia',
    industry: 'phosphate producer',
    phone: '+216 75 270 100',
    contact_person: 'Responsable Valorisation',
    created_at: new Date().toISOString(),
  };

  writeStoredSellers([...sellers, demo]);
}

// ⚠️ Prototype only — use real backend + bcrypt + JWT for production.
export function signup(data: SignupData): Seller {
  const sellers = readStoredSellers();
  const exists = sellers.some((seller) => seller.email.toLowerCase() === data.email.toLowerCase());
  if (exists) {
    throw new Error('Un compte existe déjà avec cet email.');
  }

  const seller: StoredSeller = {
    id: createId(),
    email: data.email.trim().toLowerCase(),
    password_hash: encodePassword(data.password),
    company_name: data.company_name.trim(),
    location: data.location.trim(),
    industry: data.industry,
    phone: data.phone.trim(),
    contact_person: data.contact_person.trim(),
    created_at: new Date().toISOString(),
  };

  writeStoredSellers([...sellers, seller]);
  const publicSeller = toPublicSeller(seller);
  setCurrentSeller(publicSeller);
  return publicSeller;
}

// ⚠️ Prototype only — use real backend + bcrypt + JWT for production.
export function login(email: string, password: string): Seller | null {
  const sellers = readStoredSellers();
  const seller = sellers.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!seller || seller.password_hash !== encodePassword(password)) return null;

  const publicSeller = toPublicSeller(seller);
  setCurrentSeller(publicSeller);
  return publicSeller;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_SELLER_KEY);
}

export function getCurrentSeller(): Seller | null {
  const raw = localStorage.getItem(CURRENT_SELLER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Seller;
  } catch {
    return null;
  }
}

export function updateProfile(updates: Partial<Seller>): Seller {
  const current = getCurrentSeller();
  if (!current) {
    throw new Error('Aucune session active.');
  }

  const sellers = readStoredSellers();
  const updatedPublic: Seller = { ...current, ...updates, id: current.id, created_at: current.created_at };
  const nextSellers = sellers.map((seller) =>
    seller.id === current.id ? { ...seller, ...updatedPublic, password_hash: seller.password_hash } : seller,
  );

  writeStoredSellers(nextSellers);
  setCurrentSeller(updatedPublic);
  return updatedPublic;
}

export function deleteCurrentSellerAccount(): void {
  const current = getCurrentSeller();
  if (!current) return;
  const sellers = readStoredSellers().filter((seller) => seller.id !== current.id);
  writeStoredSellers(sellers);
  localStorage.removeItem(CURRENT_SELLER_KEY);
}

// =========================================================================
// Gabest — Central image registry
// =========================================================================
//
// Toutes les images utilisées sur la plateforme sont listées ici avec des
// URLs vérifiées (Unsplash + Wikimedia Commons), libres de droits.
//
// Pour remplacer par TES photos de Gabès :
//   1. Pose tes fichiers dans src/assets/gabes/
//   2. Dans ce fichier : import x from '../../assets/gabes/x.jpg';
//      export const IMG_XXX = x;
//   3. Toutes les pages suivent automatiquement.
// =========================================================================

// --- MOUNTAIN / LANDSCAPE ---------------------------------------------------

// Montagne verte avec falaise herbeuse, ciel dramatique (Île de Skye)
export const IMG_HERO =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=90&w=2800';

// Vallée avec montagnes enneigées + sapins (valée du Yukon)
export const IMG_VALLEY =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=85&w=1800';

// Forêt / chemin entre grands arbres verts
export const IMG_FOREST =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=85&w=1600';

// Champ de blé doré au coucher du soleil
export const IMG_SUNSET_FIELD =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=85&w=1800';

// --- TUNISIA / GABÈS (Unsplash validated) -----------------------------------

// Oasis de Tunisie — palmiers vus du ciel, feuillage vert dense
export const IMG_OASIS =
  'https://images.unsplash.com/photo-1680873230275-42bc23f990fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dW5pc2lhJTIwb2FzaXMlMjBwYWxtJTIwdHJlZXMlMjBhZXJpYWx8ZW58MXx8fHwxNzc2MzgxMTUwfDA&ixlib=rb-4.1.0&q=85&w=2000';

// Agriculteur dans son champ (cultures africaines)
export const IMG_FARM =
  'https://images.unsplash.com/photo-1768775517205-7f4bc1b3f771?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFybWVyJTIwYWdyaWN1bHR1cmUlMjBmaWVsZHxlbnwxfHx8fDE3NzYzODExNTF8MA&ixlib=rb-4.1.0&q=85&w=1600';

// Portrait de médecin
export const IMG_DOCTOR =
  'https://images.unsplash.com/photo-1758691463626-0ab959babe00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBtZWRpY2FsJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3NjMzMTcwOXww&ixlib=rb-4.1.0&q=85&w=1200';

// --- INDUSTRIE / RECYCLAGE / AGRICULTURE (Unsplash) -------------------------
//
// Si l'une de ces images ne charge pas, remplace l'URL par une autre photo
// Unsplash (va sur unsplash.com, copie l'URL directe de la photo) ou dépose
// ton propre JPG dans src/assets/gabes/ et importe-le ici.

// Complexe industriel — cheminées et installations chimiques
export const IMG_INDUSTRY_PLANT =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=85&w=2400';

// Usine de recyclage — ballots de matières compressées
export const IMG_RECYCLING_PLANT =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=85&w=2400';

// Oliveraie méditerranéenne — oliviers en rangées, terre aride
export const IMG_OLIVE_GROVE =
  'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=85&w=2400';

// --- MATMATA / CHENINI — VRAIES PHOTOS DE GABÈS (Wikimedia Commons) ---------

// Matmata : village troglodyte + montagne ocre + palmiers + ciel
export const IMG_MATMATA_VILLAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Matmata_landscape.jpg/1280px-Matmata_landscape.jpg';

// Matmata : panorama aride (collines et vallées)
export const IMG_MATMATA_PANORAMA =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Matmata_panorama_01.jpg/1280px-Matmata_panorama_01.jpg';

// Matmata : palmier en premier plan + vallée
export const IMG_MATMATA_PALM =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Environnement_de_Matmata.jpg/1280px-Environnement_de_Matmata.jpg';

// Matmata : mosquée + palmiers + maisons blanches
export const IMG_MATMATA_MOSQUE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Matmata_-_panoramio_%2814%29.jpg/1280px-Matmata_-_panoramio_%2814%29.jpg';

// --- ALIASES pour compat ----------------------------------------------------
// Les anciens noms pointent vers des images appropriées pour éviter de
// casser les pages qui les utilisent encore.
export const IMG_MAP = IMG_MATMATA_PANORAMA;
export const IMG_PLANT = IMG_FARM;
export const IMG_SEA = IMG_HERO;

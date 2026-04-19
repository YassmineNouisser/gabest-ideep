GabèsHeal — Dossier des vraies photos de Gabès
================================================

Pose ici les photos réelles que tu veux utiliser sur la plateforme.
Noms recommandés (mais tu peux choisir les tiens, il suffit de mettre à
jour src/app/lib/images.ts en conséquence) :

    oasis.jpg          → hero + grande image éditoriale
    mer-ghannouch.jpg  → port / plage / vue du GCT
    parcelle.jpg       → champ agricole à Métouia ou Chenini
    medecin.jpg        → portrait médecin (hôpital régional)
    plante-malade.jpg  → pied de tomate / poivron malade
    souk.jpg           → marché de Gabès (Souk El Hafsia)
    carte-aerienne.jpg → vue satellite / drone de Gabès

Une fois les photos posées ici, ouvre src/app/lib/images.ts et :

    import oasis from '../../assets/gabes/oasis.jpg';
    export const IMG_HERO = oasis;

Fait pareil pour chaque const (IMG_SEA, IMG_FARM, IMG_DOCTOR, etc.).
Toutes les pages (landing, dashboards, cartes) se mettront à jour
automatiquement — tu n'as qu'UN fichier à éditer.

Formats acceptés : .jpg, .jpeg, .png, .webp (Vite gère tout).
Taille recommandée : largeur 1600-2400px pour le hero, 800-1200px pour
les images d'illustration.

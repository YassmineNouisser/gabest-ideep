GabèsHeal — Figma Design Specification
Plateforme IA de guérison territoriale · Hackathon H12 Innovation 3.0

IDENTITÉ VISUELLE
Concept Design : "Médecine du Territoire"
Direction esthétique : Fusion entre l'interface médicale clinique et l'identité visuelle arabo-méditerranéenne.
Chaque écran doit transmettre : rigueur scientifique + chaleur humaine + ancrage local.
Palette de Couleurs
NomHexUsageOasis Vert#1A6B47Couleur primaire, CTA, éléments sainsSable Doré#C8973AAccent, alertes modérées, patrimoineMéditerranée#1B4F72Données eau, cartes, fondationsBrique Ghannouch#8B3A2ADanger, pollution critique, urgenceBlanc Jasmin#F7F5F0Fond principal, surfacesCharbon#1C1C1ETexte principalGris Oued#8A8A8ETexte secondaire, borduresVert Clair#E8F5EEFond cartes "sain"Rouge Clair#FDECEAFond cartes "critique"Ambre Clair#FEF3DCFond cartes "modéré"
Typographie

Titre principal : Playfair Display Bold (serif élégant) — pour les gros titres et le nom de la plateforme
Sous-titres & Labels : IBM Plex Sans Medium — pour les données et métriques
Corps de texte : IBM Plex Sans Regular
Données numériques : IBM Plex Mono — pour les chiffres et statistiques
Mots arabes décoratifs : Noto Naskh Arabic — pour صفاء / شفاء / غابس comme éléments graphiques

Effets & Textures

Grain subtil sur les fonds (#F7F5F0) : noise texture opacity 4%
Bordures : 1px solid avec opacity 15-20%
Radius : 16px cartes principales, 8px badges, 24px modals
Ombres : box-shadow 0 2px 20px rgba(26,107,71,0.08)


LOGO & BRANDING
Logo GabèsHeal

Symbole : Croix médicale stylisée dont les branches forment des feuilles de palmier-dattier
Couleurs : Oasis Vert + Sable Doré
Tagline sous le logo : "من الأرض إلى الصحة" (De la terre à la santé)
Version claire sur fond blanc / Version sombre sur fond vert


ÉCRANS À DESIGNER

ÉCRAN 1 : LANDING PAGE / ACCUEIL PUBLIC
URL : gabes-heal.tn
Layout : Pleine largeur, scroll long
Section Hero (100vh)

Fond : Blanc Jasmin avec grain texture
Grande carte de Gabès à droite (60% de la largeur) — semi-transparente, lignes topographiques stylisées
À gauche :

Badge "AI Healing Gabès · H12 Innovation 3.0"
Titre H1 (Playfair Display, 56px) : "Gabès se soigne. L'IA écoute."
Sous-titre (IBM Plex Sans, 18px gris) : "La première plateforme de diagnostic territorial intelligent pour la santé et l'agriculture de Gabès"
2 boutons : [Je suis citoyen →] [Je suis agriculteur →]


En bas à gauche : mot arabe "شفاء" en très grand (Noto Naskh, 200px, opacity 6%) comme élément décoratif de fond

Section Diagnostic en Direct

Titre : "Gabès aujourd'hui — 17 Avril 2026"
3 cards côte à côte :

Card Santé : Indice 6.2/10 (Modéré) — icône poumon — couleur Ambre
Card Agriculture : Indice 7.8/10 (Bon) — icône épi — couleur Vert
Card Eau : Indice 4.1/10 (Critique) — icône goutte — couleur Rouge


Chaque card : chiffre large (IBM Plex Mono 48px), label, jauge animée, 1 ligne d'alerte

Section Comment ça marche

4 étapes visuelles horizontales avec icônes linéaires :

L'IA collecte les données → 2. Elle croise et analyse → 3. Elle diagnostique → 4. Elle prescrit


Fond : Vert Oasis très clair (#E8F5EE)

Section Impact

4 métriques grandes :

400 000 habitants protégés
3 axes de guérison
48h d'anticipation
9 projets de données historiques




ÉCRAN 2 : DASHBOARD CITOYEN
Profil : Habitant de Gabès, accès mobile et desktop
Header fixe

Logo GabèsHeal à gauche
Au centre : "Bonjour, Ahmed · Ghannouch · Vendredi 17 Avril"
À droite : cloche (notifications) + avatar

Score Saha du Jour — Section principale (hero)

Grand cercle central (300px diamètre) :

Couleur de fond selon niveau : vert/ambre/rouge
Chiffre central : "6.2" (IBM Plex Mono, 72px, bold)
Label dessous : "Indice de risque · Aujourd'hui"
Anneau animé autour du cercle (comme une montre connectée)


Autour du cercle : 3 mini-indicateurs en arc :

Air : 5.8 ↗
Eau : 7.1 →
Sol : 5.9 ↘



Alerte du Jour

Bandeau horizontal coloré selon niveau :
Fond Ambre clair + bordure Sable Doré
Icône alerte + texte : "Pic de SO₂ prévu demain matin entre 7h et 11h. Évitez les activités physiques en extérieur."
Bouton "Voir la prévision 48h →"

Carte Interactive de mon Quartier

Carte Gabès centrée sur Ghannouch
Zones colorées par niveau de risque (vert/ambre/rouge)
Points pulsants sur les capteurs actifs
Légende flottante en bas à gauche
Toggle en haut : [Santé] [Agriculture] [Eau] [Combiné]

Mes Recommandations IA du Jour

3 cards verticales :

Card 1 (icône enfant) : "Gardez les enfants à l'intérieur avant 11h"
Card 2 (icône fenêtre) : "Aérez votre maison entre 14h et 17h"
Card 3 (icône masque) : "Port du masque recommandé si sortie matinale"


Chaque card : icône colorée + titre + description courte + source de la recommandation

DrGabès — Chatbot IA

Bulle fixe en bas à droite (52px, fond Vert Oasis, icône croix/feuille)
Au clic : drawer latéral droite (400px)

Header : "DrGabès · Assistant santé IA" + badge "En ligne"
Zone de conversation :

Message bot : "Bonjour Ahmed. Aujourd'hui à Ghannouch, l'indice est modéré. Avez-vous des symptômes à signaler ?"
Message utilisateur : "J'ai eu des maux de tête ce matin"
Réponse bot : "Cela correspond au pic de particules fines détecté hier soir. Voici ce que je vous recommande..." + 3 conseils


Input en bas : "Décrivez vos symptômes..." + bouton envoyer




ÉCRAN 3 : DASHBOARD AGRICULTEUR
Profil : Agriculteur de Métouia/Chenini, usage mobile principalement
Header

Logo + "Mon exploitation · Métouia · 2.3 ha"

Score Santé de ma Terre

2 grands indicateurs côte à côte :

Gauche : Santé du Sol — 7.4/10 (Bon) — couleur Vert
Droite : Qualité de l'Eau d'irrigation — 4.8/10 (Modéré) — couleur Ambre


Sous chaque score : trend 7 jours (mini graphe sparkline IBM Plex Mono)

Prescription IA du Jour

Card principale avec fond Vert très clair, bordure gauche épaisse Vert Oasis
Icône prescription (feuille + croix)
Titre : "Recommandations pour aujourd'hui"
Liste :

✓ Irriguer avec la nappe nord (canal ouest contaminé aujourd'hui)
✓ Reporter la récolte des tomates de 2 jours
✓ Traiter les pieds de poivron zone B (stress hydrique détecté)
✗ Éviter de planter dans la parcelle C cette semaine



Diagnostic Plante — Upload Photo

Section avec zone de drop (tirets, fond très clair)
Icône appareil photo + "Photographiez votre plante malade"
Sous la zone : "L'IA identifie la maladie en moins de 10 secondes"
État après upload : photo à gauche + résultat IA à droite

Résultat : badge rouge "Mildiou détecté · 91% de confiance"
Traitement recommandé + délai d'action



Calendrier Agricole IA

Vue semaine horizontale (7 colonnes)
Chaque jour : couleur de fond (vert/ambre/rouge) selon conditions prévues
Sur chaque jour : 1-2 icônes d'action (irriguer/récolter/traiter/attendre)
Légende en bas

Alerte Eau — Compteur

Card métriques :

Eau économisée ce mois : 1 240 L (IBM Plex Mono, grand)
vs mois dernier : -18% (badge vert)




ÉCRAN 4 : DASHBOARD MÉDECIN
Profil : Médecin ou professionnel de santé, usage desktop
Layout 3 colonnes
Colonne gauche (25%) : Navigation

Logo + profil médecin
Menu vertical :

Tableau de bord
Carte épidémiologique
Signalements patients
Corrélations pollution
Alertes actives
Rapports IA


En bas : bouton "Générer rapport PDF"

Colonne centrale (50%) : Carte épidémiologique

Grande carte Gabès (100% hauteur colonne)
Heatmap superposée : densité de consultations respiratoires par quartier
Toggle :

[7 jours] [30 jours] [3 mois]
[Respiratoire] [Digestif] [Dermatologique] [Tout]


Cluster détecté : cercle rouge pulsant sur Bou Chemma
Tooltip au survol : "Bou Chemma : +34% consultations ce mois. Corrélation SO₂ : 0.87"

Colonne droite (25%) : Alertes & Insights IA

Titre : "Insights IA · Aujourd'hui"
Card alerte rouge :

"Cluster détecté à Bou Chemma"
"Corrélation identifiée avec rejet industriel du 14 avril"
Bouton "Voir l'analyse →"


Card tendance ambre :

"Consultations asthme +22% cette semaine"
Mini graphe


Card info bleue :

"Qualité de l'air favorable demain"
"Baisse attendue des consultations"


Section : "Rapport automatique IA"

Preview texte rapport avec boutons : [Télécharger PDF] [Partager ANPE]




ÉCRAN 5 : MODULE IA — DIAGNOSTIC TERRITOIRE
Vue analytique pour décideurs
Header

Titre : "Diagnostic Territoire · GabèsHeal IA"
Date + bouton "Actualiser les données"

Score Global de Santé Territoriale

Grande visualisation centrale :

Cercle externe : Santé publique (6.2)
Cercle moyen : Agriculture (7.8)
Cercle interne : Environnement (4.9)
Centre : Score global "6.3" + label "Modéré"
Les 3 anneaux en couleurs différentes (rouge/vert/ambre)



Graphe de Corrélation IA

Titre : "L'IA a détecté : quand les cultures souffrent, la santé suit"
Graphe double axe :

Ligne rouge : consultations respiratoires (axe gauche)
Ligne verte : stress agricole moyen (axe droite)
Les deux lignes montrent la même tendance avec décalage de 12 jours
Zone ombrée entre les deux : "Corrélation 0.84"


Note sous le graphe : "Basé sur 9 projets de terrain 2016-2018 + données temps réel"

Tableau des Prédictions IA — 14 jours

Tableau stylisé :

Colonne 1 : Date
Colonne 2 : Zone
Colonne 3 : Risque Santé prédit
Colonne 4 : Risque Agricole prédit
Colonne 5 : Action recommandée


Lignes alternées vert clair / blanc
Cellules risque : badges colorés


ÉCRAN 6 : ONBOARDING — CHOIX DU PROFIL
Premier écran après inscription
Layout centré, fond Blanc Jasmin

Logo GabèsHeal en haut (centré)
Titre (Playfair Display, 36px) : "Comment GabèsHeal peut vous aider ?"
Sous-titre : "Choisissez votre profil pour personnaliser votre expérience"
3 grandes cards de sélection (côte à côte) :
Card Citoyen

Illustration : silhouette famille devant maison
Fond Vert clair
Titre : "Je suis citoyen"
Description : "Je veux protéger ma famille des risques de pollution quotidiens"
Bouton : "Choisir ce profil →"

Card Agriculteur

Illustration : silhouette agriculteur dans oasis
Fond Ambre clair
Titre : "Je suis agriculteur"
Description : "Je veux optimiser mes cultures et protéger mes terres"
Bouton : "Choisir ce profil →"

Card Professionnel de santé

Illustration : silhouette médecin
Fond Bleu clair
Titre : "Je suis professionnel de santé"
Description : "Je veux suivre les tendances sanitaires de la région"
Bouton : "Choisir ce profil →"




ÉCRAN 7 : MOBILE — VUE AGRICULTEUR (DIAGNOSTIC PLANTE)
Vue mobile 390px

Status bar iOS/Android
Header : "< Retour · Diagnostic Plante"

Zone Upload

Fond blanc avec bordure tirets (2px, Vert Oasis, opacity 40%)
Icône appareil photo (40px, Vert Oasis)
Texte : "Photographiez la feuille malade"
Texte secondaire : "ou importez depuis votre galerie"

État Analyse en cours

Photo affichée en fond (floue)
Overlay semi-transparent
Spinner circulaire Vert Oasis
Texte : "L'IA analyse votre plante..."
Barre de progression avec étapes : "Détection → Classification → Diagnostic"

État Résultat

Photo nette à gauche (demi-écran)
Zone rouge annotée sur la feuille (bounding box)
À droite :

Badge rouge : "Mildiou · 91%"
Titre : "Mildiou de la tomate"
Description courte de la maladie
Séparateur
Titre "Traitement recommandé :"
3 étapes numérotées
Bouton principal : "Commander le traitement →"
Bouton secondaire : "Partager avec un agronome"




COMPOSANTS UI À CRÉER DANS FIGMA
Score Ring

Cercle SVG animé (stroke-dasharray)
Couleur dynamique selon valeur : <4 rouge, 4-7 ambre, >7 vert
Chiffre central IBM Plex Mono
Label dessous IBM Plex Sans 12px

Alert Banner

3 variants : Critique (rouge), Modéré (ambre), Info (vert)
Icône gauche + texte + bouton action droite
Hauteur fixe 56px

Metric Card

Fond coloré clair selon type
Label 12px gris dessus
Valeur grande 32px IBM Plex Mono
Trend indicator (flèche + % couleur)
Sparkline 7 jours en bas

Zone Card (Carte)

Fond blanc, bordure gauche 4px colorée
Nom zone + badge niveau
2-3 métriques en ligne
"Voir détail →" en bas

Chat Bubble (DrGabès)

Bot : fond Vert très clair, texte gauche
User : fond Vert Oasis, texte blanc, droite
Timestamp IBM Plex Mono 10px
Avatar bot : icône GabèsHeal 24px

Navigation Mobile

4 icônes : Accueil · Carte · DrGabès · Profil
Active : vert + label + fond vert clair
Inactive : gris


ANIMATIONS & MICRO-INTERACTIONS

Score Ring : animation fill 0→valeur en 1.2s ease-out au chargement
Alert Banner : slide-in depuis le haut en 0.3s
Carte : zoom smooth sur quartier de l'utilisateur au chargement
Metric Cards : count-up de 0 à la valeur finale en 1s
Chatbot : bubble scale 0.8→1 + fade-in à chaque message
Diagnostic photo : shimmer loading sur overlay
Dashboard : stagger-in des cartes (delay 0.1s entre chaque)


GRILLE & ESPACEMENTS

Desktop : 12 colonnes, gutter 24px, margin 80px
Tablet : 8 colonnes, gutter 16px, margin 40px
Mobile : 4 colonnes, gutter 12px, margin 16px
Unité de base : 8px
Padding card : 24px desktop / 16px mobile
Gap entre sections : 80px desktop / 48px mobile


NOTES POUR LE DESIGNER FIGMA

Utiliser Auto Layout partout pour la flexibilité
Créer des Variables Figma pour toutes les couleurs de la palette
Créer des Styles de texte pour chaque niveau typographique
Utiliser des Components avec variants pour : Score Ring, Alert Banner, Metric Card, Zone Card
La carte Gabès : utiliser un screenshot OpenStreetMap stylisé en vert/ambre comme base
Les illustrations de profil (onboarding) : style ligne fine, pas de photos réelles
Exporter les assets en @2x minimum
Prototyper les transitions : Landing → Onboarding → Dashboard citoyen
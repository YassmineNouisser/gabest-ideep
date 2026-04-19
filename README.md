
  # Website Prompt

  This is a code bundle for Website Prompt. The original project is available at https://www.figma.com/design/igmuUSUnbL13t9kLKzga9j/Website-Prompt.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Dashboard médecin + IA GaBest

  La section **"GaBest · Zones IA"** du dashboard médecin appelle un backend FastAPI
  qui charge réellement le modèle PyTorch `gabest_best.pt` et calcule les prédictions + XAI.

  ### Lancer les 2 serveurs (2 terminaux)

  **Terminal 1 — backend IA** (première fois seulement : `pip install -r backend/requirements.txt` dans un venv)
  ```bash
  cd backend
  source .venv/bin/activate
  python main.py
  # API sur http://127.0.0.1:8000
  ```

  **Terminal 2 — frontend React**
  ```bash
  npm run dev
  # App sur http://localhost:5173 (ou port suivant)
  ```

  Ouvre `http://localhost:5173/dashboard/doctor` puis clique sur **"GaBest · Zones IA"** dans le menu.
  Le dataset couvre 2023-01-01 → 2024-12-31 — utilise le sélecteur de date dans la bannière
  pour explorer différents jours (essaye `2024-06-15` pour une distribution mixte).

  Voir [backend/README.md](backend/README.md) pour le détail de l'API et des explications XAI.
  
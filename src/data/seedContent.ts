import { Article, Project } from "../types";
import projectEcommerceImg from "../assets/images/project_ecommerce_abidjan_1794896781780.jpg";
import projectFintechImg from "../assets/images/project_corporate_fintech_1794896780892.jpg";
import projectPortalImg from "../assets/images/project_creative_portal_1794896782081.jpg";
import blogSeoImg from "../assets/images/blog_seo_strategy_1794896781826.jpg";
import blogUxImg from "../assets/images/blog_ux_ifran_1794896781820.jpg";
import blogSpeedImg from "../assets/images/blog_web_speed_1794896782165.jpg";

export const SEED_PROJECTS: Project[] = [
  {
    id: "boutique-aethel-abidjan",
    title: "Boutique Mode & Accessoires Aethel",
    description:
      "Conception et développement d'une boutique e-commerce sur mesure optimisée pour les paiements mobiles et une navigation rapide sur réseau 4G/3G. Mise en place d'un catalogue dynamique, d'un tunnel de commande fluide et d'un référencement local structuré.",
    category: "E-Commerce",
    client: "Aethel Studio",
    year: "2026",
    imageUrl: projectEcommerceImg,
    technologies: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
    featured: true,
    createdAt: "2026-04-12T10:00:00.000Z",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    id: "plateforme-finance-hub",
    title: "Tableau de Bord Financier & Suivi Trésorerie",
    description:
      "Application web d'analyse financière permettant aux dirigeants de PME de suivre leurs flux de trésorerie, leurs revenus mensuels et leurs indicateurs clés en temps réel avec une interface sombre haute lisibilité.",
    category: "Application Web",
    client: "Finance Hub CI",
    year: "2026",
    imageUrl: projectFintechImg,
    technologies: ["React", "Vite", "Tailwind CSS", "Firestore"],
    featured: false,
    createdAt: "2026-03-04T14:30:00.000Z",
    updatedAt: "2026-03-04T14:30:00.000Z",
  },
  {
    id: "portail-editorial-echo",
    title: "Portail Éditorial & Revue Culturelle Echo",
    description:
      "Plateforme éditoriale responsive pensée pour la lecture longue sur tablette et ordinateur. Architecture de contenu modulaire, recherche instantanée d'articles et optimisation Core Web Vitals.",
    category: "Portail & Blog",
    client: "Context Agency",
    year: "2025",
    imageUrl: projectPortalImg,
    technologies: ["React", "Markdown", "SEO Technique", "Responsive UI"],
    featured: false,
    createdAt: "2025-11-18T09:15:00.000Z",
    updatedAt: "2025-11-18T09:15:00.000Z",
  },
];

export const SEED_ARTICLES: Omit<Article, "createdAt" | "updatedAt">[] = [
  {
    id: "conseil-seo-cote-divoire",
    title: "5 Conseils essentiels pour booster le SEO de votre site en Côte d'Ivoire",
    category: "Conseil",
    readTime: "4 min",
    views: 124,
    author: "Soumahoro Abdul",
    imageUrl: blogSeoImg,
    content: `
Le Référencement Naturel (SEO) est le meilleur moyen d'obtenir des clients qualifiés sans dépenser un centime en publicité. En Côte d'Ivoire et partout en Afrique, la compétition en ligne grandit de jour en jour. 

Voici 5 conseils concrets pour positionner votre site web sur la première page de Google :

### 1. Ciblez des mots-clés localisés
Ne cherchez pas simplement à vous positionner sur "création de site internet". Ciblez plutôt des expressions précises comme **"création de site internet à Abidjan"** ou **"meilleur développeur web Côte d'Ivoire"**. Ces mots-clés de "longue traîne" ont moins de concurrence et attirent une clientèle prête à acheter !

### 2. Optimisez pour les connexions mobiles (3G/4G)
En Côte d'Ivoire, plus de 90% des internautes naviguent depuis leur smartphone, souvent avec des connexions mobiles parfois instables. Votre site doit charger en **moins de 2 secondes**. Compressez vos images, réduisez le code superflu et choisissez un hébergeur rapide.

### 3. Créez une fiche Google Business Profile (ex-Google My Business)
C'est gratuit et indispensable pour le SEO local. Remplissez toutes vos informations réelles, indiquez vos horaires d'ouverture, mentionnez votre numéro de téléphone (comme le **+225 0749958303**) et encouragez vos clients satisfaits à laisser des avis 5 étoiles.

### 4. Rédigez des articles à forte valeur ajoutée
Devenez la référence dans votre domaine. Si vous vendez des services, expliquez comment choisir le bon prestataire, ou donnez des conseils pratiques. Google adore les contenus riches, originaux et régulièrement mis à jour.

### 5. Obtenez des backlinks locaux
Un backlink est un lien depuis un autre site vers le vôtre. Essayez d'obtenir des articles de presse en ligne ivoirienne, ou des partenariats avec des blogueurs locaux. Plus vous avez de liens de sites ivoiriens de confiance (.ci, .com), plus Google considèrera votre site comme une autorité.
`,
  },
  {
    id: "methode-ifran-design",
    title: "La Méthode IFRAN : Comment concevoir une expérience utilisateur performante",
    category: "Méthode",
    readTime: "6 min",
    views: 89,
    author: "Soumahoro Abdul",
    imageUrl: blogUxImg,
    content: `
L'expérience utilisateur (UX) ne se résume pas à de belles couleurs. Lors de mon parcours de formation à l'**IFRAN (Institut Français Du Numérique)**, j'ai appris et développé une méthodologie rigoureuse pour concevoir des produits digitaux qui convertissent les visiteurs en clients fidèles.

Voici les 4 étapes-clés de cette démarche de conception performante :

### Étape 1 : L'Immersion et l'Empathie
Avant de tracer la moindre ligne de code, nous devons comprendre qui sont vos utilisateurs finaux.
- Quels sont leurs problèmes au quotidien ?
- Comment naviguent-ils ?
- Quels sont leurs freins d'achat ?
Nous concevons des personas et des cartes d'expérience pour guider chaque décision visuelle et technique.

### Étape 2 : Le Wireframing (Maquettage fil de fer)
Nous concevons la structure de votre site en noir et blanc. Cela permet de se concentrer uniquement sur l'ergonomie, la hiérarchie des informations et le parcours de conversion. Sans fioritures visuelles, on valide d'abord que le message est clair.

### Étape 3 : L'identité Visuelle et l'Aesthetics (UI)
C'est ici qu'intervient la cohérence de marque. Dans mon travail, j'accorde une importance capitale à l'harmonie des polices, aux contrastes pour l'accessibilité et aux animations fluides qui guident l'œil du visiteur sans le distraire.

### Étape 4 : L'Intégration Propre et Mobile-First
Un bon design n'est rien s'il est mal développé. Toutes les transitions doivent être d'une fluidité parfaite. Le responsive design doit s'adapter au pixel près à tous les formats d'écrans pour offrir une expérience sans couture.
`,
  },
  {
    id: "methode-vitesse-conversion",
    title: "Pourquoi la vitesse de votre site définit directement votre chiffre d'affaires",
    category: "Conseil",
    readTime: "5 min",
    views: 153,
    author: "Soumahoro Abdul",
    imageUrl: blogSpeedImg,
    content: `
Saviez-vous qu'une seule seconde de retard dans le chargement d'une page mobile peut réduire vos conversions de **20%** ? Sur internet, l'attention est la ressource la plus rare. Si votre page met trop de temps à s'afficher, vos clients potentiels iront chez votre concurrent.

### Le lien incontestable entre performances et ventes
Les géants du web comme Amazon et Google ont prouvé que la vitesse est directement corrélée au chiffre d'affaires :
1. **Baisse du taux de rebond** : Un site rapide retient l'attention immédiate.
2. **Amélioration du score SEO** : Google pénalise activement les sites trop lents sur mobile.
3. **Sentiment de sécurité** : Un site qui réagit instantanément inspire confiance lors de transactions.

### Mes engagements techniques pour une rapidité extrême
En tant que développeur web issu d'une formation moderne, je mets un point d'honneur à livrer des applications d'une réactivité chirurgicale en utilisant les meilleures technologies actuelles (comme Vite, React, et Tailwind CSS). N'hésitez pas à lancer votre projet avec moi pour transformer vos idées en solutions numériques rapides et rentables !
`,
  },
];

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  BookOpen, 
  ArrowLeft, 
  Eye, 
  Calendar, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, doc, updateDoc, increment, setDoc, serverTimestamp } from "firebase/firestore";
import { Article } from "../types";
import Markdown from "react-markdown";

// Default high-quality, relevant seed articles if DB is empty
const SEED_ARTICLES: Omit<Article, "createdAt" | "updatedAt">[] = [
  {
    id: "conseil-seo-cote-divoire",
    title: "5 Conseils essentiels pour booster le SEO de votre site en Côte d'Ivoire",
    category: "Conseil",
    readTime: "4 min",
    views: 124,
    author: "Soumahoro Abdul",
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
`
  },
  {
    id: "methode-ifran-design",
    title: "La Méthode IFRAN : Comment concevoir une expérience utilisateur performante",
    category: "Méthode",
    readTime: "6 min",
    views: 89,
    author: "Soumahoro Abdul",
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
C'est ici qu'intervient la cohérence de marque. Dans mon travail, j'accorde une importance capitale à l'harmonie des polices (ex: *Space Grotesk* pour les titres audacieux et *Inter* pour le texte), aux contrastes pour l'accessibilité et aux animations fluides qui guident l'œil du visiteur sans le distraire.

### Étape 4 : L'Intégration Propre et Mobile-First
Un bon design n'est rien s'il est mal développé. Toutes les transitions doivent être d'une fluidité parfaite (grâce à des outils comme Framer Motion). Le responsive design doit s'adapter au pixel près à tous les formats d'écrans pour offrir une expérience sans couture.
`
  },
  {
    id: "methode-vitesse-conversion",
    title: "Pourquoi la vitesse de votre site définit directement votre chiffre d'affaires",
    category: "Conseil",
    readTime: "5 min",
    views: 153,
    author: "Soumahoro Abdul",
    content: `
Saviez-vous qu'une seule seconde de retard dans le chargement d'une page mobile peut réduire vos conversions de **20%** ? Sur internet, l'attention est la ressource la plus rare. Si votre page met trop de temps à s'afficher, vos clients potentiels iront chez votre concurrent.

### Le lien incontestable entre performances et ventes
Les géants du web comme Amazon et Google ont prouvé que la vitesse est directement corrélée au chiffre d'affaires :
1. **Baisse du taux de rebond** : Un site rapide retient l'attention immédiate.
2. **Amélioration du score SEO** : Google pénalise activement les sites trop lents sur mobile.
3. **Sentiment de sécurité** : Un site qui réagit instantanément inspire confiance lors de transactions.

### Mes engagements techniques pour une rapidité extrême
En tant que développeur web issu d'une formation moderne, je mets un point d'honneur à livrer des applications d'une réactivité chirurgicale en utilisant les meilleures technologies actuelles (comme Vite, React, et Tailwind CSS). N'hésitez pas à lancer votre projet avec moi pour transformer vos idées en solutions numériques rapides et rentables !
`
  }
];

interface BlogSectionProps {
  isAdminView?: boolean;
}

export default function BlogSection({ isAdminView = false }: BlogSectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Fetch articles from FireStore
  const fetchArticles = async () => {
    setLoading(true);
    const path = "articles";
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        // Create matching local state from seed articles
        const localizedSeedList: Article[] = SEED_ARTICLES.map((art) => ({
          ...art,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        // Attempt database seeding ONLY if the current logged-in user is the admin
        if (auth.currentUser && auth.currentUser.email === "soumahoroabdul211@gmail.com") {
          try {
            const promises = SEED_ARTICLES.map((art) => {
              const docRef = doc(db, path, art.id);
              return setDoc(docRef, {
                ...art,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            });
            await Promise.all(promises);
          } catch (seedError) {
            console.warn("Silent seeding error for admin:", seedError);
          }
        }
        
        setArticles(localizedSeedList.sort((a, b) => b.views - a.views));
      } else {
        const list = snap.docs.map((d) => d.data() as Article);
        // Sort by createdAt desc or views
        setArticles(list.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [isAdminView]);

  // Handle article selection and view incrementation
  const handleOpenArticle = async (article: Article) => {
    setActiveArticle(article);
    window.scrollTo({ top: 350, behavior: "smooth" });

    // Safely increment views in the background
    const path = `articles/${article.id}`;
    try {
      const articleRef = doc(db, "articles", article.id);
      await updateDoc(articleRef, {
        views: increment(1)
      });
      // Increment local state views too
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: a.views + 1 } : a));
    } catch (e) {
      console.warn("Could not increment views due to rules or connection:", e);
    }
  };

  // Filter articles based on category and search query
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === "Tous" || art.category === selectedCategory;
    const matchesSearch = 
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      art.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {activeArticle ? (
          // Full Article Reader View
          <motion.div
            key="article-reader"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-slate-100 p-8 md:p-14 shadow-xl"
          >
            {/* Back Button */}
            <button
              onClick={() => setActiveArticle(null)}
              className="flex items-center gap-2 text-brand-blue font-semibold hover:text-brand-orange transition-colors mb-8 cursor-pointer group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Retour aux articles
            </button>

            {/* Category badge & details */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase ${
                activeArticle.category === "Conseil" 
                  ? "bg-brand-orange/10 text-brand-orange" 
                  : "bg-brand-blue/10 text-brand-blue"
              }`}>
                {activeArticle.category}
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>{activeArticle.readTime} de lecture</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Eye className="w-4 h-4" />
                <span>{activeArticle.views} vues</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-display font-black text-brand-blue mb-8 leading-tight">
              {activeArticle.title}
            </h1>

            {/* Author info */}
            <div className="flex items-center gap-4 pb-8 mb-8 border-b border-slate-100">
              <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center font-bold text-lg font-display">
                SA
              </div>
              <div>
                <p className="font-bold text-brand-blue">{activeArticle.author}</p>
                <p className="text-xs text-slate-400 font-medium">Développeur Web Senior • Diplômé d'IFRAN</p>
              </div>
            </div>

            {/* Content (Render as clean Markdown) */}
            <div className="markdown-body text-slate-600 text-lg leading-relaxed space-y-6">
              <Markdown>{activeArticle.content}</Markdown>
            </div>

            {/* Footer contact CTA */}
            <div className="mt-16 bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h4 className="font-display font-black text-xl text-brand-blue mb-2 uppercase">Ce conseil vous a été utile ?</h4>
                <p className="text-slate-500 font-medium text-sm">Discutons de la mise en pratique de ces méthodes sur votre projet !</p>
              </div>
              <a
                href="#contact"
                onClick={() => setActiveArticle(null)}
                className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-orange transition-colors shrink-0 text-center"
              >
                Discuter de mon projet
              </a>
            </div>
          </motion.div>
        ) : (
          // Listing Grid View
          <motion.div
            key="articles-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {/* Header filters and search */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              {/* Category selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                {["Tous", "Conseil", "Méthode"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/10"
                        : "bg-white text-slate-500 hover:text-brand-blue hover:bg-slate-100 border border-slate-200/50"
                    }`}
                  >
                    {cat === "Tous" ? "Tous les articles" : cat + "s"}
                  </button>
                ))}
              </div>

              {/* Searchinput */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un conseil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl font-medium text-sm text-brand-blue placeholder:text-slate-400 focus:outline-none focus:border-brand-orange/60 transition-colors"
                />
              </div>
            </div>

            {loading ? (
              // Loading Skeleton Grid
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl h-[420px] shadow-sm border border-slate-100 p-8 animate-pulse space-y-6">
                    <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    <div className="h-14 w-full bg-slate-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-150 rounded" />
                      <div className="h-4 w-[85%] bg-slate-150 rounded" />
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between">
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              // Empty search results
              <div className="text-center py-20 bg-white border border-slate-100 rounded-[2rem]">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-display font-black text-brand-blue mb-2">AUCUN ARTICLE TROUVÉ</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Nous n'avons pas trouvé d'articles de blog correspondant à "{searchTerm}". Essayez d'autres mots-clés ou réinitialisez les filtres !
                </p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); }}
                  className="mt-6 px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-orange transition-colors cursor-pointer"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              // Fine Article Cards Grid
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((art, index) => (
                  <motion.div
                    key={art.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex flex-col bg-white rounded-3xl border border-slate-100 hover:border-brand-orange/30 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group"
                  >
                    {/* Top decoration header */}
                    <div className="p-8 pb-0">
                      <div className="flex justify-between items-center mb-6">
                        <span className={`px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          art.category === "Conseil" 
                            ? "bg-brand-orange/10 text-brand-orange" 
                            : "bg-brand-blue/10 text-brand-blue"
                        }`}>
                          {art.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{art.readTime}</span>
                        </div>
                      </div>

                      <h3 
                        onClick={() => handleOpenArticle(art)}
                        className="text-xl font-display font-black text-brand-blue mb-4 group-hover:text-brand-orange transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {art.title}
                      </h3>

                      <p className="text-slate-500 font-medium text-sm line-clamp-3 mb-8 leading-relaxed">
                        {art.content.replace(/[#*`_\[\]]/g, "").substring(0, 150)}...
                      </p>
                    </div>

                    {/* Bottom stats row */}
                    <div className="mt-auto px-8 py-5 bg-slate-50 border-t border-slate-100/60 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {art.views} vues
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleOpenArticle(art)}
                        className="text-brand-blue font-bold text-xs flex items-center gap-1 group-hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        Lire la suite
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

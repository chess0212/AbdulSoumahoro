import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  BookOpen, 
  ArrowLeft, 
  Eye, 
  Clock, 
  ChevronRight
} from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import { Article } from "../types";
import Markdown from "react-markdown";
import { SEED_ARTICLES } from "../data/seedContent";
import SafeImage from "./SafeImage";

interface BlogSectionProps {
  isAdminView?: boolean;
}

export default function BlogSection({ isAdminView = false }: BlogSectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Fetch articles from Firestore
  const fetchArticles = async () => {
    setLoading(true);
    const path = "articles";
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const localizedSeedList: Article[] = SEED_ARTICLES.map((art) => ({
          ...art,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        // Attempt database seeding ONLY if the current logged-in user is the admin
        if (auth.currentUser && auth.currentUser.email?.toLowerCase() === "technews203@gmail.com") {
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
    window.scrollTo({ top: 180, behavior: "smooth" });

    try {
      const articleRef = doc(db, "articles", article.id);
      await updateDoc(articleRef, {
        views: increment(1)
      });
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: a.views + 1 } : a));
      setActiveArticle(prev => prev && prev.id === article.id ? { ...prev, views: prev.views + 1 } : prev);
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 md:p-14 shadow-xl"
          >
            {/* Back Button */}
            <button
              onClick={() => setActiveArticle(null)}
              className="flex items-center gap-2 text-brand-blue font-semibold hover:text-brand-orange transition-colors mb-8 cursor-pointer group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour aux articles
            </button>

            {/* Clean unboxed metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-5">
              <span className="text-brand-orange font-bold uppercase tracking-wider">
                {activeArticle.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activeArticle.readTime} de lecture
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Eye className="w-3.5 h-3.5" />
                {activeArticle.views} vues
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-display font-black text-brand-blue mb-8 leading-tight">
              {activeArticle.title}
            </h1>

            {/* Author info */}
            <div className="flex items-center gap-4 pb-8 mb-8 border-b border-slate-100">
              <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center font-bold text-lg font-display shrink-0">
                SA
              </div>
              <div>
                <p className="font-bold text-brand-blue">{activeArticle.author}</p>
                <p className="text-xs text-slate-400 font-medium">Développeur Web Senior · Diplômé d'IFRAN</p>
              </div>
            </div>

            {/* Cover Illustration Image */}
            {activeArticle.imageUrl && (
              <div className="mb-10 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[16/9] max-h-[460px] w-full">
                <SafeImage
                  src={activeArticle.imageUrl}
                  alt={activeArticle.title}
                  fallbackTitle={activeArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content (Render as clean Markdown with styled inline images) */}
            <div className="markdown-body text-slate-600 text-lg leading-relaxed space-y-6">
              <Markdown
                components={{
                  img: ({ src, alt }) => (
                    <span className="block my-6 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                      <SafeImage
                        src={src}
                        alt={alt || activeArticle.title}
                        fallbackTitle={alt || activeArticle.title}
                        className="w-full max-h-[460px] object-cover"
                      />
                    </span>
                  ),
                }}
              >
                {activeArticle.content}
              </Markdown>
            </div>

            {/* Footer contact CTA */}
            <div className="mt-14 bg-slate-50 rounded-2xl p-6 md:p-10 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h4 className="font-display font-black text-xl text-brand-blue mb-2 uppercase">Ce conseil vous a été utile ?</h4>
                <p className="text-slate-500 font-medium text-sm">Discutons de la mise en pratique de ces méthodes sur votre projet !</p>
              </div>
              <a
                href="#contact"
                onClick={() => setActiveArticle(null)}
                className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-orange transition-colors shrink-0 text-center text-sm whitespace-nowrap"
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
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/70 rounded-xl overflow-x-auto w-full md:w-auto">
                {["Tous", "Conseil", "Méthode"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? "bg-brand-blue text-white shadow-sm"
                        : "text-slate-600 hover:text-brand-blue hover:bg-slate-50"
                    }`}
                  >
                    {cat === "Tous" ? "Tous les articles" : cat + "s"}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                  <div key={n} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                    <div className="aspect-[4/3] bg-slate-200" />
                    <div className="p-7 space-y-4">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-12 w-full bg-slate-200 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-3.5 w-full bg-slate-100 rounded" />
                        <div className="h-3.5 w-[85%] bg-slate-100 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              // Empty search results
              <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-display font-black text-brand-blue mb-2">AUCUN ARTICLE TROUVÉ</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Nous n'avons pas trouvé d'articles de blog correspondant à "{searchTerm}". Essayez d'autres mots-clés ou réinitialisez les filtres !
                </p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); }}
                  className="mt-6 px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-orange transition-colors cursor-pointer text-sm"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              // Article Cards Grid with Illustration Images
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((art, index) => (
                  <motion.article
                    key={art.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.06, 0.24) }}
                    onClick={() => handleOpenArticle(art)}
                    className="flex flex-col bg-white rounded-2xl border border-slate-200/70 hover:border-brand-orange/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  >
                    {/* Illustration Cover */}
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      <SafeImage
                        src={art.imageUrl}
                        alt={art.title}
                        fallbackTitle={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Card Body */}
                    <div className="p-6 md:p-7 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
                        <span className="text-brand-orange font-bold uppercase tracking-wider">
                          {art.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{art.readTime}</span>
                      </div>

                      <h3 className="text-xl font-display font-black text-brand-blue mb-3 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-slate-500 font-medium text-sm line-clamp-3 mb-6 leading-relaxed">
                        {art.content.replace(/!\[.*?\]\(.*?\)/g, "").replace(/[#*`_\[\]]/g, "").trim().substring(0, 145)}...
                      </p>

                      {/* Bottom stats row */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium tabular-nums">
                          <Eye className="w-3.5 h-3.5" />
                          {art.views} vues
                        </span>

                        <span className="text-brand-blue font-bold text-xs flex items-center gap-1 group-hover:text-brand-orange transition-colors whitespace-nowrap">
                          Lire la suite
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

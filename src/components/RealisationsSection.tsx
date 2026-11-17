import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, ChevronRight, FolderKanban, X } from "lucide-react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Project, ProjectCategory } from "../types";
import { SEED_PROJECTS } from "../data/seedContent";
import SafeImage from "./SafeImage";
import { sanitizeExternalUrl } from "../utils/imageHelper";

interface RealisationsSectionProps {
  onRequestQuote: () => void;
}

const CATEGORIES: ("Tous" | ProjectCategory)[] = [
  "Tous",
  "Site Vitrine",
  "E-Commerce",
  "Application Web",
  "Portail & Blog",
];

export default function RealisationsSection({ onRequestQuote }: RealisationsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"Tous" | ProjectCategory>("Tous");
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "projects"));
        if (snap.empty) {
          if (auth.currentUser && auth.currentUser.email?.toLowerCase() === "technews203@gmail.com") {
            try {
              await Promise.all(
                SEED_PROJECTS.map((project) => setDoc(doc(db, "projects", project.id), project))
              );
            } catch (seedErr) {
              console.warn("Silent seeding error for projects:", seedErr);
            }
          }
          setProjects(SEED_PROJECTS);
        } else {
          const list = snap.docs.map((d) => d.data() as Project);
          setProjects(
            list.sort((a, b) => {
              if (Boolean(a.featured) !== Boolean(b.featured)) {
                return a.featured ? -1 : 1;
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
          );
        }
      } catch (err) {
        console.warn("Utilisation des réalisations par défaut en attendant la synchronisation Firestore:", err);
        setProjects(SEED_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveProject(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeProject]);

  const filteredProjects = projects.filter(
    (project) => selectedCategory === "Tous" || project.category === selectedCategory
  );

  const safeLiveUrl = activeProject ? sanitizeExternalUrl(activeProject.liveUrl) : null;

  return (
    <section id="realisations" className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <p className="text-brand-orange font-bold text-xs tracking-widest uppercase mb-3">
              Portfolio sélectionné
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-black text-brand-blue uppercase leading-tight">
              MES <span className="text-brand-orange italic">RÉALISATIONS</span>
            </h2>
            <p className="text-slate-600 mt-4 text-base md:text-lg leading-relaxed">
              Sites vitrines, boutiques e-commerce et applications web conçus sur mesure pour allier esthétique, vitesse et résultats commerciaux.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-600 hover:text-brand-blue"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-brand-blue mb-2">
              Aucune réalisation dans cette catégorie
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Sélectionnez une autre catégorie pour explorer les projets disponibles.
            </p>
            <button
              onClick={() => setSelectedCategory("Tous")}
              className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-orange transition-colors cursor-pointer whitespace-nowrap"
            >
              Voir toutes les réalisations
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => {
              const isSpotlight = index === 0 && filteredProjects.length >= 3;
              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.08, 0.24) }}
                  onClick={() => setActiveProject(project)}
                  className={`group cursor-pointer bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-brand-orange/40 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl ${
                    isSpotlight ? "lg:col-span-2 lg:grid lg:grid-cols-12" : ""
                  }`}
                >
                  <div
                    className={`relative overflow-hidden bg-slate-200 ${
                      isSpotlight ? "lg:col-span-7 aspect-[4/3] lg:aspect-auto lg:h-full" : "aspect-[4/3]"
                    }`}
                  >
                    <SafeImage
                      src={project.imageUrl}
                      alt={project.title}
                      fallbackTitle={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div
                    className={`p-6 md:p-8 flex flex-col justify-between bg-white ${
                      isSpotlight ? "lg:col-span-5" : "flex-1"
                    }`}
                  >
                    <div>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium mb-3">
                        <span className="text-brand-orange font-semibold">{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.client}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{project.year}</span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-display font-bold text-brand-blue group-hover:text-brand-orange transition-colors mb-3 leading-snug">
                        {project.title}
                      </h3>

                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6">
                        {project.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div className="text-xs text-slate-500 truncate">
                        {project.technologies && project.technologies.length > 0
                          ? project.technologies.slice(0, 3).join(" · ")
                          : project.client}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue group-hover:text-brand-orange transition-colors whitespace-nowrap shrink-0">
                        Voir le projet
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeProject && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProject(null)}
              className="absolute inset-0 bg-brand-blue/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setActiveProject(null)}
                aria-label="Fermer l'aperçu du projet"
                className="absolute top-4 right-4 z-20 p-2.5 bg-white/95 hover:bg-brand-orange hover:text-white text-brand-blue rounded-full shadow-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto">
                <div className="aspect-[16/9] max-h-[420px] w-full bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={activeProject.imageUrl}
                    alt={activeProject.title}
                    fallbackTitle={activeProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-10 space-y-6">
                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
                    <span className="text-brand-orange font-bold uppercase tracking-wider">
                      {activeProject.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Client : {activeProject.client}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Livré en {activeProject.year}</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-display font-black text-brand-blue leading-tight">
                    {activeProject.title}
                  </h3>

                  <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                    {activeProject.description}
                  </p>

                  {activeProject.technologies && activeProject.technologies.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Technologies mobilisées
                      </p>
                      <p className="text-sm font-medium text-brand-blue">
                        {activeProject.technologies.join(" · ")}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    {safeLiveUrl ? (
                      <a
                        href={safeLiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 hover:border-brand-blue text-brand-blue rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                      >
                        Visiter le site en ligne
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        Projet livré sur mesure par Soumahoro Abdul
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setActiveProject(null);
                        onRequestQuote();
                      }}
                      className="px-6 py-3 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Lancer un projet similaire
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

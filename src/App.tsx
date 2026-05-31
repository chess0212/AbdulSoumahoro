/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Laptop, 
  Settings, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Headphones, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  Monitor,
  CheckCircle2,
  X,
  MessageCircle,
  Trophy,
  GraduationCap,
  ArrowRight,
  Linkedin,
  Instagram,
  BookOpen,
  Lock
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";
import BlogSection from "./components/BlogSection";
import AdminPanel from "./components/AdminPanel";

const services = [
  {
    title: "CRÉATION DE SITES WEB",
    description: "Sites vitrines, e-commerce, portails, blogs et plus encore.",
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    title: "SITES RESPONSIVES",
    description: "Sites adaptatifs pour mobile, tablette et ordinateur.",
    icon: <Smartphone className="w-6 h-6" />,
  },
  {
    title: "MAINTENANCE & MISE À JOUR",
    description: "Maintenance régulière, mises à jour de contenu et de sécurité.",
    icon: <Settings className="w-6 h-6" />,
  },
  {
    title: "RÉFÉRENCEMENT & PERFORMANCE",
    description: "Optimisation SEO et vitesse pour un meilleur classement.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "SÉCURITÉ & SAUVEGARDE",
    description: "Protection de votre site et sauvegardes régulières.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    title: "SUPPORT & ACCOMPAGNEMENT",
    description: "Assistance technique et conseils personnalisés.",
    icon: <Headphones className="w-6 h-6" />,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"portfolio" | "blog" | "admin">("portfolio");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const handleLogoClick = () => {
    setActiveTab("portfolio");
    const now = Date.now();
    const tooSlow = now - lastClickTimeRef.current > 4000;
    lastClickTimeRef.current = now;

    const nextCount = tooSlow ? 1 : logoClickCount + 1;
    if (nextCount >= 4) {
      setIsAdminUnlocked((prev) => !prev);
      setLogoClickCount(0);
    } else {
      setLogoClickCount(nextCount);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && !isAdminUnlocked) {
      setActiveTab("portfolio");
    }
  }, [activeTab, isAdminUnlocked]);

  const whatsappLink = "https://wa.me/2250749958303";
  const emailLink = "mailto:soumahoroabdul211@gmail.com";

  // Real-time visitor logger
  useEffect(() => {
    const tracked = sessionStorage.getItem("has_visited_portfolio");
    if (!tracked) {
      sessionStorage.setItem("has_visited_portfolio", "true");
      
      const updateVisits = async () => {
        try {
          const globalRef = doc(db, "stats", "global");
          const globalDoc = await getDoc(globalRef);
          
          if (!globalDoc.exists()) {
            await setDoc(globalRef, {
              totalVisits: 1,
              lastUpdated: new Date().toISOString()
            });
          } else {
            await updateDoc(globalRef, {
              totalVisits: increment(1),
              lastUpdated: new Date().toISOString()
            });
          }
          
          // Daily visit format, e.g. "Dimanche"
          const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
          const capitalizedDay = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);
          const dailyRef = doc(db, "stats/global/daily", capitalizedDay);
          const dailyDoc = await getDoc(dailyRef);
          
          if (!dailyDoc.exists()) {
            await setDoc(dailyRef, {
              count: 1,
              lastUpdated: new Date().toISOString()
            });
          } else {
            await updateDoc(dailyRef, {
              count: increment(1),
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn("Visitor statistics tracking is currently offline or initialising:", e);
        }
      };
      updateVisits();
    }
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-brand-orange selection:text-white pb-10">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-blue/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button 
              onClick={handleLogoClick} 
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 cursor-pointer text-left focus:outline-none"
            >
              <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center shrink-0">
                <span className="text-brand-orange font-display font-bold text-xl select-none">S</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight hidden sm:block text-brand-blue select-none">
                Soumahoro<span className="text-brand-orange">Abdul</span>
              </span>
            </motion.button>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 md:gap-8 text-xs sm:text-sm font-semibold max-w-full overflow-x-auto scrollbar-none py-1.5 px-3 bg-slate-50 md:bg-transparent rounded-full border border-slate-100 md:border-none">
            <button 
              onClick={() => { setActiveTab("portfolio"); setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }), 100); }} 
              className={`transition-colors duration-300 cursor-pointer whitespace-nowrap ${activeTab === "portfolio" ? "text-brand-orange font-bold" : "text-slate-600 hover:text-brand-blue"}`}
            >
              Services
            </button>
            <button 
              onClick={() => { setActiveTab("portfolio"); setTimeout(() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }), 100); }} 
              className={`transition-colors duration-300 cursor-pointer whitespace-nowrap ${activeTab === "portfolio" ? "text-brand-orange font-bold" : "text-slate-600 hover:text-brand-blue"}`}
            >
              À propos
            </button>
            <button 
              onClick={() => setActiveTab("blog")} 
              className={`flex items-center gap-1 transition-colors duration-300 cursor-pointer whitespace-nowrap ${activeTab === "blog" ? "text-brand-orange font-bold" : "text-slate-600 hover:text-brand-blue"}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              Blog Conseils & Méthodes
            </button>
            {isAdminUnlocked && (
              <button 
                onClick={() => setActiveTab("admin")} 
                className={`flex items-center gap-1 transition-colors duration-300 cursor-pointer whitespace-nowrap ${activeTab === "admin" ? "text-brand-orange font-bold" : "text-slate-600 hover:text-brand-blue"}`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                Admin
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-blue text-white px-4 py-1.5 rounded-full hover:bg-brand-orange transition-all duration-300 shadow-md shadow-brand-blue/10 cursor-pointer shrink-0 text-xs font-bold"
            >
              Contacter
            </button>
          </div>
        </div>
      </nav>
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {activeTab === "portfolio" && (
            <motion.div
              key="portfolio-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-blue -z-10 hidden lg:block transform skew-x-6" />
          
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-block px-4 py-1.5 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                Développeur Web Senior
              </span>
              <h1 className="text-6xl md:text-8xl font-display font-black leading-none mb-6 text-brand-blue">
                CRÉONS <br />
                VOTRE <br />
                <span className="text-brand-orange italic font-serif">PRÉSENCE</span> <br />
                DIGITALE
              </h1>
              <p className="text-xl text-slate-600 max-w-lg mb-10 leading-relaxed">
                Je conçois des sites web modernes, performants et sur mesure pour booster votre activité en ligne.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-brand-blue text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-orange transition-all duration-300 group shadow-xl shadow-brand-blue/20 cursor-pointer"
                >
                  Lancer mon projet
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-3 px-6 py-4 border-2 border-brand-blue/10 rounded-xl">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-sm text-brand-blue">Disponible dès maintenant</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-square lg:aspect-auto h-[600px] hidden md:block"
            >
              <div className="absolute inset-0 bg-brand-orange/5 rounded-3xl -rotate-6" />
              <div className="absolute inset-0 bg-brand-blue/5 rounded-3xl rotate-3" />
              <img 
                src="https://i.postimg.cc/FzC4Hyc8/Whats-App-Image-2026-05-03-at-19-44-25-(2).jpg" 
                alt="Soumahoro Abdul Graduation"
                className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-brand-orange/20 rounded-full text-brand-orange">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">DIPLÔME IFRAN</p>
                  <p className="text-3xl font-display font-black text-brand-blue italic">PROMO 2022</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info Banner */}
        <section className="bg-brand-blue py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-brand-orange" />
              </div>
              <p className="font-medium text-lg italic">Bachelor en Développement Web</p>
            </div>
            <div className="h-0.5 w-12 bg-brand-orange/30 hidden md:block" />
            <p className="text-2xl font-display font-bold">Soumahoro Abdul Ghafar Mohammed Junior</p>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-orange/10 rounded-full blur-3xl" />
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="relative space-y-8"
                >
                  <h2 className="text-4xl md:text-5xl font-display font-black text-brand-blue uppercase">
                    MON <span className="text-brand-orange italic">PARCOURS</span>
                  </h2>
                  <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
                    <p>
                      Diplômé de l'école <span className="font-bold text-brand-blue">IFRAN</span> (Institut Français Du Numérique), j'ai acquis une base technique solide mêlant rigueur académique et projets concrets. Ifran a été le berceau de ma passion, m'enseignant que le code n'est pas qu'une suite de syntaxes, mais un outil de transformation digitale.
                    </p>
                    <p>
                      Au-delà de l'écran, mon esprit de compétition et ma discipline se sont forgés sur les parquets de <span className="font-bold text-brand-blue">Basketball</span>. En tant que passionné et pratiquant de ce sport depuis des années, j'y puise ma capacité à travailler en équipe, ma persévérance face aux défis et ma vision stratégique.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <GraduationCap className="text-brand-orange w-8 h-8" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formation</p>
                        <p className="font-display font-bold text-brand-blue">IFRAN 2022</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <Trophy className="text-brand-orange w-8 h-8" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sport</p>
                        <p className="font-display font-bold text-brand-blue">Basketball Player</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="hidden md:flex gap-4">
                <div className="w-full h-[500px] bg-brand-blue rounded-3xl overflow-hidden relative group shadow-2xl shadow-brand-blue/20">
                  <div className="absolute inset-0 bg-brand-orange/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <img 
                    src="https://i.postimg.cc/66MwcXSW/Whats-App-Image-2026-05-03-at-19-44-25-(4).jpg" 
                    alt="Basketball Court" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-6 left-6 z-20">
                    <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg font-bold text-brand-blue text-sm">Discipline & Teamwork</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-display font-black mb-4 uppercase text-brand-blue"
              >
                MES <span className="text-brand-orange italic">SERVICES</span>
              </motion.h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Des solutions techniques de pointe pour accompagner votre croissance et garantir votre succès digital.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-10 bg-slate-50 rounded-2xl hover:bg-brand-blue hover:text-white transition-all duration-500 group border border-slate-100"
                >
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg mb-8 group-hover:bg-brand-orange transition-colors">
                    <div className="text-brand-blue group-hover:text-white transition-colors">
                      {service.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-4 tracking-tight uppercase group-hover:text-brand-orange transition-colors">{service.title}</h3>
                  <p className="text-slate-500 group-hover:text-slate-200 leading-relaxed font-medium">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="bg-brand-blue p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl text-white font-display font-black mb-8 uppercase italic leading-tight">
                  VOUS AVEZ UN PROJET ?
                </h2>
                <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                  Discutons-en et transformons vos idées en une solution digitale efficace !
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-orange text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-brand-orange/40 cursor-pointer"
                  >
                    Démarrer maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
            </motion.div>
          )}

          {activeTab === "blog" && (
            <motion.div
              key="blog-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-6 py-12 md:py-16"
            >
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-brand-orange/10 text-brand-orange rounded-full text-xs font-black tracking-widest uppercase mb-4">
                  CONSEILS & MÉTHODES
                </span>
                <h2 className="text-4xl md:text-6xl font-display font-black text-brand-blue uppercase mb-4">
                  LE BLOG DU <span className="text-brand-orange italic font-serif">DIGITAL</span>
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto font-semibold">
                  Découvrez mes techniques de conception web, astuces d'optimisation SEO de pointe et conseils stratégiques pour propulser votre entreprise en ligne.
                </p>
              </div>

              <BlogSection />
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-6 py-12 md:py-16"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Contact / Footer */}
        <footer id="contact" className="bg-white pt-24 pb-12 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16 mb-20 text-brand-blue">
              <div>
                <h3 className="text-2xl font-display font-black mb-8 uppercase">ME CONTACTER</h3>
                <div className="space-y-6">
                  <a href={emailLink} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Email</p>
                      <p className="font-semibold">soumahoroabdul211@gmail.com</p>
                    </div>
                  </a>
                  <a href={`tel:+2250749958303`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Téléphone</p>
                      <p className="font-semibold">+225 0749958303</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Localisation</p>
                      <p className="font-semibold italic font-serif">Côte d'Ivoire</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-display font-black mb-8 uppercase">LIENS RAPIDES</h3>
                <ul className="space-y-4 font-semibold text-sm">
                  <li>
                    <button 
                      onClick={() => { setActiveTab("portfolio"); setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }), 100); }} 
                      className="text-slate-600 hover:text-brand-orange transition-colors cursor-pointer text-left font-semibold"
                    >
                      Services de Création
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setActiveTab("portfolio"); setTimeout(() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }), 100); }} 
                      className="text-slate-600 hover:text-brand-orange transition-colors cursor-pointer text-left font-semibold"
                    >
                      Mon Parcours
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setActiveTab("blog"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                      className="text-slate-600 hover:text-brand-orange transition-colors cursor-pointer text-left font-bold text-brand-orange flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Blog Conseils & Méthodes
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-display font-black mb-8 uppercase italic">PRESENCE <span className="text-brand-orange">DIGITALE</span></h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Basé en Côte d'Ivoire, j'aide les entreprises et entrepreneurs à bâtir une image en ligne forte et professionnelle à travers le monde.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="https://www.linkedin.com/in/abdul-soumahoro-988246193" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.instagram.com/abdulsdt?igsh=MWM4ZjZ0Zmxvb3d1ag==&utm_source=ig_contact_invite" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-sm text-slate-400">© 2026 SOUMAHORO ABDUL. Tous droits réservés.</p>
              <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
                <a href="#" className="hover:text-brand-orange">Mentions Légales</a>
                <a href="#" className="hover:text-brand-orange">Confidentialité</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Contact Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-blue/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-brand-blue" />
              </button>

              <div className="text-center">
                <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Zap className="w-10 h-10 text-brand-orange fill-brand-orange" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-brand-blue uppercase mb-4 leading-tight">
                  PRÊT À <span className="text-brand-orange italic">Gagner</span> LE MATCH ?
                </h2>
                <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                  Chaque grand projet commence par une simple discussion. Comme sur un terrain de basket, la stratégie est la clé du succès. Contactez-moi pour discuter de la faisabilité de votre projet !
                </p>

                <div className="grid gap-4">
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-green-500 text-white p-6 rounded-2xl group hover:scale-[1.02] transition-all shadow-lg shadow-green-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">Parler sur WhatsApp</span>
                    </div>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-all" />
                  </a>

                  <a 
                    href={emailLink}
                    className="flex items-center justify-between bg-brand-blue text-white p-6 rounded-2xl group hover:scale-[1.02] transition-all shadow-lg shadow-brand-blue/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Mail className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">Envoyer un Email</span>
                    </div>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-all" />
                  </a>
                </div>

                <p className="mt-8 text-sm text-slate-400 font-medium">Réponse garantie sous 24h</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}


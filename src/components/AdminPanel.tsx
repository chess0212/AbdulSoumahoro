import { useState, useEffect, ChangeEvent } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  db,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Lock,
  LayoutDashboard,
  FileText,
  Eye,
  Plus,
  Trash2,
  Edit3,
  X,
  LogOut,
  CheckCircle,
  TrendingUp,
  Globe2,
  Calendar,
  AlertCircle,
  Upload,
  FolderKanban,
  Image as ImageIcon,
  ExternalLink,
  Star,
} from "lucide-react";
import { Article, Project, ProjectCategory, VisitStats } from "../types";
import { compressImageFile, isValidImageSource, sanitizeExternalUrl } from "../utils/imageHelper";
import SafeImage from "./SafeImage";

type AdminSectionTab = "articles" | "projects";

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active dashboard tab
  const [adminTab, setAdminTab] = useState<AdminSectionTab>("articles");

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetchingArticles, setFetchingArticles] = useState<boolean>(false);

  // Projects (Réalisations) state
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Article Editor states
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<"Conseil" | "Méthode">("Conseil");
  const [readTime, setReadTime] = useState<string>("5 min");
  const [articleImageUrl, setArticleImageUrl] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [articleImageLoading, setArticleImageLoading] = useState<boolean>(false);
  const [articleFormError, setArticleFormError] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState<boolean>(false);
  const [confirmDeleteArticleId, setConfirmDeleteArticleId] = useState<string | null>(null);

  // Project Editor states
  const [projectEditorOpen, setProjectEditorOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>("Site Vitrine");
  const [projectClient, setProjectClient] = useState<string>("");
  const [projectYear, setProjectYear] = useState<string>("2026");
  const [projectImageUrl, setProjectImageUrl] = useState<string>("");
  const [projectLiveUrl, setProjectLiveUrl] = useState<string>("");
  const [projectTechnologies, setProjectTechnologies] = useState<string>("");
  const [projectFeatured, setProjectFeatured] = useState<boolean>(false);
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [projectImageLoading, setProjectImageLoading] = useState<boolean>(false);
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState<boolean>(false);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // Statistics states
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [dailyVisits, setDailyVisits] = useState<{ date: string; count: number }[]>([]);

  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);

  const isInIframe = typeof window !== "undefined" && window.self !== window.top;
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
  const projectId = String(auth.app.options.projectId || "");

  const formatAuthError = (e: unknown): { code: string; message: string } => {
    const err = e as { code?: string; message?: string };
    const code = err?.code || "";
    const rawMsg = err?.message || String(e);

    if (code === "auth/operation-not-allowed") {
      return {
        code,
        message: `La connexion Google n'est pas encore activée dans votre projet Firebase (${projectId}). Allez dans Console Firebase > Authentication > Sign-in method > Google et activez-le.`,
      };
    }
    if (code === "auth/unauthorized-domain") {
      return {
        code,
        message: `Le domaine « ${currentHost} » n'est pas autorisé dans Firebase. Vérifiez qu'il figure exactement ainsi (sans https://, et avec/sans www selon votre URL) dans Console Firebase > Authentication > Paramètres > Domaines autorisés.`,
      };
    }
    if (
      code === "auth/invalid-api-key" ||
      code === "auth/api-key-not-valid.-please-pass-a-valid-api-key." ||
      rawMsg.includes("requests-from-referer")
    ) {
      return {
        code: code || "auth/api-key-restricted",
        message: `La clé API Firebase bloque les requêtes depuis « ${currentHost} » ou est invalide. Vérifiez les restrictions HTTP de la clé API dans Google Cloud Console.`,
      };
    }
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/popup-blocked" ||
      rawMsg.includes("cancelled-popup-request") ||
      rawMsg.includes("popup")
    ) {
      return {
        code: code || "auth/popup-blocked",
        message: isInIframe
          ? "La fenêtre pop-up de connexion Google a été fermée ou bloquée par l'iframe de l'aperçu."
          : "La fenêtre pop-up de connexion Google a été fermée ou bloquée par votre navigateur. Essayez la connexion par redirection ci-dessous.",
      };
    }
    if (code === "auth/network-request-failed") {
      return {
        code,
        message: "Erreur réseau lors de la connexion à Firebase Auth. Vérifiez votre connexion internet ou un éventuel bloqueur de scripts.",
      };
    }
    return {
      code: code || "auth/unknown",
      message: rawMsg || "Une erreur est survenue lors de la connexion Google.",
    };
  };

  // Handle redirect result & listen to auth
  useEffect(() => {
    let active = true;

    getRedirectResult(auth).catch((err) => {
      if (!active) return;
      const formatted = formatAuthError(err);
      console.warn("Google Redirect Sign-in error:", formatted.code);
      setLoginErrorCode(formatted.code);
      setLoginError(formatted.message);
      setLoggingIn(false);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!active) return;
      setUser(currentUser);
      if (currentUser && currentUser.email?.toLowerCase() === "technews203@gmail.com") {
        setIsAdmin(true);
        loadAdminData();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loadAdminData = async () => {
    setFetchingArticles(true);
    setFetchingProjects(true);
    setProjectsError(null);

    // Fetch articles
    try {
      const artSnap = await getDocs(collection(db, "articles"));
      const list = artSnap.docs.map((d) => d.data() as Article);
      setArticles(
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch (e) {
      console.warn("Error reading admin articles:", e);
    }
    setFetchingArticles(false);

    // Fetch projects
    try {
      const projSnap = await getDocs(collection(db, "projects"));
      const projList = projSnap.docs.map((d) => d.data() as Project);
      setProjects(
        projList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("permission")) {
        setProjectsError(
          "La collection 'projects' nécessite la mise à jour des règles Firestore (firestore.rules) dans votre console Firebase."
        );
      }
      console.warn("Error reading admin projects:", msg);
    }
    setFetchingProjects(false);

    // Fetch stats
    try {
      const statsDoc = await getDoc(doc(db, "stats", "global"));
      if (statsDoc.exists()) {
        const data = statsDoc.data() as VisitStats;
        setTotalVisits(data.totalVisits);
      } else {
        setTotalVisits(0);
      }
    } catch (e) {
      console.warn("Error reading admin stats:", e);
    }

    // Fetch daily stats
    try {
      const daysSnap = await getDocs(collection(db, "stats/global/daily"));
      if (!daysSnap.empty) {
        const list = daysSnap.docs.map((d) => ({
          date: d.id,
          count: d.data().count as number,
        }));
        setDailyVisits(list.sort((a, b) => a.date.localeCompare(b.date)));
      } else {
        setDailyVisits([
          { date: "Mardi", count: 12 },
          { date: "Mercredi", count: 28 },
          { date: "Jeudi", count: 45 },
          { date: "Vendredi", count: 68 },
          { date: "Samedi", count: 94 },
          { date: "Dimanche", count: 128 },
        ]);
      }
    } catch (e) {
      console.warn("Error daily stats:", e);
    }
  };

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoginError(null);
    setLoginErrorCode(null);
    setLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const formatted = formatAuthError(e);
      console.warn("Google Sign-in popup info:", formatted.code);
      setLoginErrorCode(formatted.code);
      setLoginError(formatted.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRedirectLogin = async () => {
    if (loggingIn) return;
    setLoginError(null);
    setLoginErrorCode(null);
    setLoggingIn(true);
    try {
      sessionStorage.setItem("pending_admin_redirect", "true");
      await signInWithRedirect(auth, googleProvider);
    } catch (e: unknown) {
      sessionStorage.removeItem("pending_admin_redirect");
      const formatted = formatAuthError(e);
      setLoginErrorCode(formatted.code);
      setLoginError(formatted.message);
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setArticles([]);
      setProjects([]);
      setTotalVisits(0);
    } catch (e) {
      console.warn("Signout Failed:", e);
    }
  };

  const slugify = (text: string, fallbackPrefix: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 90) || `${fallbackPrefix}-${Math.random().toString(36).substring(2, 7)}`;

  // Image file handlers
  const handleArticleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setArticleFormError(null);
    setArticleImageLoading(true);
    try {
      const compressed = await compressImageFile(file);
      setArticleImageUrl(compressed);
    } catch (err: unknown) {
      setArticleFormError(err instanceof Error ? err.message : "Erreur lors du traitement de l'image.");
    } finally {
      setArticleImageLoading(false);
    }
  };

  const handleProjectImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProjectFormError(null);
    setProjectImageLoading(true);
    try {
      const compressed = await compressImageFile(file);
      setProjectImageUrl(compressed);
    } catch (err: unknown) {
      setProjectFormError(err instanceof Error ? err.message : "Erreur lors du traitement de l'image.");
    } finally {
      setProjectImageLoading(false);
    }
  };

  // Create or Update Article
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setArticleFormError(null);
    if (!title.trim() || !content.trim() || !readTime.trim()) return;

    const trimmedImage = articleImageUrl.trim();
    if (trimmedImage && !isValidImageSource(trimmedImage)) {
      setArticleFormError("L'URL de l'image d'illustration n'est pas valide.");
      return;
    }

    const id = editingArticle ? editingArticle.id : slugify(title, "article");
    const now = new Date().toISOString();

    const payload: Article = {
      id,
      title: title.trim(),
      content: content.trim(),
      category,
      readTime: readTime.trim(),
      views: editingArticle ? editingArticle.views : 0,
      author: "Soumahoro Abdul",
      createdAt: editingArticle ? editingArticle.createdAt : now,
      updatedAt: now,
      ...(trimmedImage ? { imageUrl: trimmedImage } : {}),
    };

    const path = "articles";
    setSavingArticle(true);
    try {
      await setDoc(doc(db, path, id), payload);
      if (editingArticle) {
        setArticles((prev) => prev.map((a) => (a.id === id ? payload : a)));
      } else {
        setArticles((prev) => [payload, ...prev]);
      }
      handleCloseEditor();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setArticleFormError(
        msg.toLowerCase().includes("permission")
          ? "Permission refusée par Firestore. Assurez-vous d'avoir publié le nouveau fichier firestore.rules dans votre console Firebase."
          : `Impossible d'enregistrer l'article : ${msg}`
      );
      try {
        handleFirestoreError(err, editingArticle ? OperationType.UPDATE : OperationType.CREATE, `${path}/${id}`);
      } catch {
        // Error is surfaced cleanly in articleFormError
      }
    } finally {
      setSavingArticle(false);
    }
  };

  const handleEditClick = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setCategory(art.category);
    setReadTime(art.readTime);
    setArticleImageUrl(art.imageUrl || "");
    setContent(art.content);
    setArticleFormError(null);
    setEditorOpen(true);
  };

  const handleDeleteArticle = async (id: string) => {
    const path = `articles/${id}`;
    try {
      await deleteDoc(doc(db, "articles", id));
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteArticleId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleOpenNewEditor = () => {
    setEditingArticle(null);
    setTitle("");
    setCategory("Conseil");
    setReadTime("5 min");
    setArticleImageUrl("");
    setContent("");
    setArticleFormError(null);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingArticle(null);
    setArticleFormError(null);
  };

  // Create or Update Project (Réalisation)
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectFormError(null);

    const trimmedTitle = projectTitle.trim();
    const trimmedClient = projectClient.trim();
    const trimmedYear = projectYear.trim();
    const trimmedDesc = projectDescription.trim();
    const trimmedImage = projectImageUrl.trim();
    const trimmedLiveUrl = projectLiveUrl.trim();

    if (!trimmedTitle || !trimmedClient || !trimmedYear || !trimmedDesc || !trimmedImage) {
      setProjectFormError("Veuillez remplir tous les champs obligatoires et fournir une image d'aperçu.");
      return;
    }

    if (!isValidImageSource(trimmedImage)) {
      setProjectFormError("L'image d'aperçu fournie n'est pas valide (utilisez une image importée ou une URL http/https).");
      return;
    }

    if (trimmedLiveUrl && !sanitizeExternalUrl(trimmedLiveUrl)) {
      setProjectFormError("Le lien du site doit commencer par https:// ou http://.");
      return;
    }

    const techList = projectTechnologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    const id = editingProject ? editingProject.id : slugify(trimmedTitle, "projet");
    const now = new Date().toISOString();

    const payload: Project = {
      id,
      title: trimmedTitle,
      description: trimmedDesc,
      category: projectCategory,
      client: trimmedClient,
      year: trimmedYear,
      imageUrl: trimmedImage,
      featured: projectFeatured,
      createdAt: editingProject ? editingProject.createdAt : now,
      updatedAt: now,
      ...(trimmedLiveUrl ? { liveUrl: trimmedLiveUrl } : {}),
      ...(techList.length > 0 ? { technologies: techList } : {}),
    };

    const path = "projects";
    setSavingProject(true);
    try {
      await setDoc(doc(db, path, id), payload);
      if (editingProject) {
        setProjects((prev) => prev.map((p) => (p.id === id ? payload : p)));
      } else {
        setProjects((prev) => [payload, ...prev]);
      }
      setProjectsError(null);
      handleCloseProjectEditor();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setProjectFormError(
        msg.toLowerCase().includes("permission")
          ? "Permission refusée par Firestore. Publiez le fichier firestore.rules mis à jour dans votre console Firebase (projet flexxy-4ff4f)."
          : `Impossible d'enregistrer la réalisation : ${msg}`
      );
      try {
        handleFirestoreError(err, editingProject ? OperationType.UPDATE : OperationType.CREATE, `${path}/${id}`);
      } catch {
        // Error is surfaced cleanly in projectFormError
      }
    } finally {
      setSavingProject(false);
    }
  };

  const handleOpenNewProjectEditor = () => {
    setEditingProject(null);
    setProjectTitle("");
    setProjectCategory("Site Vitrine");
    setProjectClient("");
    setProjectYear("2026");
    setProjectImageUrl("");
    setProjectLiveUrl("");
    setProjectTechnologies("React, TypeScript, Tailwind CSS");
    setProjectFeatured(false);
    setProjectDescription("");
    setProjectFormError(null);
    setProjectEditorOpen(true);
  };

  const handleEditProjectClick = (proj: Project) => {
    setEditingProject(proj);
    setProjectTitle(proj.title);
    setProjectCategory(proj.category);
    setProjectClient(proj.client);
    setProjectYear(proj.year);
    setProjectImageUrl(proj.imageUrl);
    setProjectLiveUrl(proj.liveUrl || "");
    setProjectTechnologies((proj.technologies || []).join(", "));
    setProjectFeatured(Boolean(proj.featured));
    setProjectDescription(proj.description);
    setProjectFormError(null);
    setProjectEditorOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    const path = `projects/${id}`;
    try {
      await deleteDoc(doc(db, "projects", id));
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteProjectId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleCloseProjectEditor = () => {
    setProjectEditorOpen(false);
    setEditingProject(null);
    setProjectFormError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold text-sm">Chargement du panel admin...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!user ? (
        // Login Page
        <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-10 md:p-14 text-center shadow-lg">
          <div className="w-20 h-20 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-brand-blue" />
          </div>
          <h2 className="text-3xl font-display font-black text-brand-blue uppercase mb-4">ESPACE ADMINISTRATEUR</h2>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            Connectez-vous avec votre compte Google autorisé pour gérer vos réalisations, vos articles illustrés et suivre vos statistiques de visites.
          </p>

          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full bg-brand-blue text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-brand-orange disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-blue/10 cursor-pointer text-sm"
          >
            {loggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                Connexion en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-current fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.45 1.635l2.45-2.45c-1.84-1.72-4.24-2.785-6.9-2.785-5.523 0-10 4.477-10 10s4.477 10 10 10c5.77 0 9.6-4.06 9.6-9.76a10.04 10.04 0 00-.14-2.12H12.24z"/>
                </svg>
                Se connecter avec Google
              </>
            )}
          </button>

          {!isInIframe && (
            <button
              type="button"
              onClick={handleRedirectLogin}
              disabled={loggingIn}
              className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-brand-blue py-3 px-5 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              Connexion par redirection (si le pop-up est bloqué)
            </button>
          )}

          {loginError && (
            <div className="mt-6 p-5 bg-red-50/80 border border-red-100 rounded-2xl text-left shadow-sm space-y-3">
              <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                Connexion interrompue
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {loginError}
              </p>
              <div className="p-3 bg-white/80 border border-slate-200/70 rounded-xl text-[11px] text-slate-500 font-mono space-y-1">
                {loginErrorCode && <p>Code : {loginErrorCode}</p>}
                <p>Domaine : {currentHost || "inconnu"}</p>
                <p>Projet : {projectId || "non configuré"}</p>
              </div>
              {isInIframe && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-brand-blue text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Ouvrir le site dans un nouvel onglet ↗
                </a>
              )}
            </div>
          )}
        </div>
      ) : !isAdmin ? (
        // Non-Admin access denied page
        <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-10 md:p-14 text-center shadow-lg">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-3xl font-display font-black text-brand-blue uppercase mb-4">ACCÈS RESTREINT</h2>

          <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl mb-6">
            <p className="text-sm font-semibold text-slate-700">Vous êtes connecté en tant que :</p>
            <p className="text-amber-700 font-mono text-xs font-bold truncate mt-1">{user.email}</p>
          </div>

          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            Seul le compte administrateur principal de <span className="font-bold text-brand-blue">Soumahoro Abdul</span> (<span className="font-semibold text-brand-orange">technews203@gmail.com</span>) a le droit de publier des articles ou des réalisations.
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-brand-blue rounded-xl font-bold transition-colors cursor-pointer text-sm"
            >
              Changer de compte
            </button>
          </div>
        </div>
      ) : (
        // Authorized Admin Dashboard
        <div className="space-y-10">
          {/* Header Panel */}
          <div className="bg-white border border-slate-100 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div>
              <p className="text-brand-orange uppercase text-xs font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                CONSOLE ADMINISTRATEUR
              </p>
              <h2 className="text-3xl font-display font-black text-brand-blue uppercase">BIENVENUE SOUMAHORO ABDUL</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">
                Gérez vos réalisations portfolio, vos articles illustrés et suivez l'audience du site.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer border border-rose-100 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

          {/* Stats Widgets Row */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Widget 1: Total Visits */}
            <div className="bg-gradient-to-br from-brand-blue to-[#002b54] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/10 rounded-xl text-brand-orange">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Audience Globale</span>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-display font-black tracking-tight mb-2 tabular-nums">
                    {totalVisits}
                  </p>
                  <p className="text-slate-300 font-medium text-sm">Visites totales sur votre site</p>
                </div>
              </div>
            </div>

            {/* Widget 2: Active publications & projects */}
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl text-brand-blue border border-slate-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">Contenus en Ligne</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl md:text-4xl font-display font-black text-brand-blue tabular-nums">
                      {articles.length}
                    </p>
                    <p className="text-slate-500 font-medium text-xs mt-1">Articles de blog</p>
                  </div>
                  <div>
                    <p className="text-3xl md:text-4xl font-display font-black text-brand-orange tabular-nums">
                      {projects.length}
                    </p>
                    <p className="text-slate-500 font-medium text-xs mt-1">Réalisations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 3: Audience growth */}
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl text-brand-orange border border-slate-100">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">Tendance de Visites</span>
              </div>

              <div className="flex items-end justify-between gap-2 h-16 pt-2">
                {dailyVisits.map((day, i) => {
                  const max = Math.max(...dailyVisits.map((d) => d.count), 1);
                  const percent = Math.max((day.count / max) * 100, 10);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                      <span className="absolute bottom-full mb-1 bg-brand-blue text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none tabular-nums">
                        {day.count} visites
                      </span>
                      <div
                        style={{ height: `${percent}%` }}
                        className="w-full bg-slate-200 group-hover:bg-brand-orange rounded-t-md transition-all duration-300"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                        {day.date.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl w-fit">
            <button
              onClick={() => setAdminTab("articles")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                adminTab === "articles"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-blue"
              }`}
            >
              <FileText className="w-4 h-4" />
              Articles du Blog ({articles.length})
            </button>
            <button
              onClick={() => setAdminTab("projects")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                adminTab === "projects"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-blue"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Mes Réalisations ({projects.length})
            </button>
          </div>

          {adminTab === "articles" ? (
            /* Articles Management Table */
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-black text-xl text-brand-blue uppercase">LISTE DES ARTICLES</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Publiez des conseils et méthodes avec des images d'illustration.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewEditor}
                  className="bg-brand-orange hover:bg-brand-blue text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-orange/10 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nouvel Article
                </button>
              </div>

              {fetchingArticles ? (
                <div className="p-20 text-center text-slate-400 font-medium">
                  Chargement des articles...
                </div>
              ) : articles.length === 0 ? (
                <div className="p-20 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-semibold mb-2">Aucun article dans la base de données</p>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Créez votre premier article illustré pour alimenter votre blog.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        <th className="py-4 px-8">Illustration & Titre</th>
                        <th className="py-4 px-6">Catégorie</th>
                        <th className="py-4 px-6">Lecture</th>
                        <th className="py-4 px-6 text-center">Vues</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((art) => (
                        <tr key={art.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-slate-600 font-medium text-sm">
                          <td className="py-4 px-8 max-w-md">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/70 shrink-0">
                                {art.imageUrl ? (
                                  <SafeImage src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p
                                  onClick={() => handleEditClick(art)}
                                  className="font-display font-bold text-brand-blue hover:text-brand-orange cursor-pointer truncate transition-colors"
                                >
                                  {art.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 tabular-nums">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(art.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-bold text-brand-blue">
                            {art.category}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-500">{art.readTime}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-500 text-xs tabular-nums">
                              <Eye className="w-3.5 h-3.5" />
                              {art.views}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {confirmDeleteArticleId === art.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDeleteArticle(art.id)}
                                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteArticleId(null)}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleEditClick(art)}
                                  className="p-2 bg-slate-50 border border-slate-200/70 hover:border-brand-blue/30 text-brand-blue rounded-lg transition-colors cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteArticleId(art.id)}
                                  className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Projects (Réalisations) Management Table */
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-black text-xl text-brand-blue uppercase">MES RÉALISATIONS</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Ajoutez vos projets web pour les exposer sur la page d'accueil de votre portfolio.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewProjectEditor}
                  className="bg-brand-orange hover:bg-brand-blue text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-orange/10 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle Réalisation
                </button>
              </div>

              {projectsError && (
                <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Synchronisation Firestore requise</p>
                    <p>{projectsError}</p>
                  </div>
                </div>
              )}

              {fetchingProjects ? (
                <div className="p-20 text-center text-slate-400 font-medium">
                  Chargement des réalisations...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-20 text-center">
                  <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-semibold mb-2">Aucune réalisation enregistrée dans Firestore</p>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Tant que vous n'ajoutez pas vos propres projets ici, le site affiche vos 3 réalisations de démonstration. Ajoutez votre premier projet dès maintenant !
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        <th className="py-4 px-8">Aperçu & Projet</th>
                        <th className="py-4 px-6">Catégorie</th>
                        <th className="py-4 px-6">Client</th>
                        <th className="py-4 px-6">Année</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((proj) => {
                        const safeUrl = sanitizeExternalUrl(proj.liveUrl);
                        return (
                          <tr key={proj.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-slate-600 font-medium text-sm">
                            <td className="py-4 px-8 max-w-md">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/70 shrink-0">
                                  <SafeImage src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p
                                      onClick={() => handleEditProjectClick(proj)}
                                      className="font-display font-bold text-brand-blue hover:text-brand-orange cursor-pointer truncate transition-colors"
                                    >
                                      {proj.title}
                                    </p>
                                    {proj.featured && (
                                      <Star className="w-3.5 h-3.5 text-brand-orange fill-brand-orange shrink-0" />
                                    )}
                                  </div>
                                  {safeUrl && (
                                    <a
                                      href={safeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-orange mt-0.5"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Voir en ligne
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-xs font-bold text-brand-blue">{proj.category}</td>
                            <td className="py-4 px-6 text-xs text-slate-500">{proj.client}</td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-500 tabular-nums">{proj.year}</td>
                            <td className="py-4 px-6 text-right">
                              {confirmDeleteProjectId === proj.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDeleteProject(proj.id)}
                                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteProjectId(null)}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleEditProjectClick(proj)}
                                    className="p-2 bg-slate-50 border border-slate-200/70 hover:border-brand-blue/30 text-brand-blue rounded-lg transition-colors cursor-pointer"
                                    title="Modifier"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteProjectId(proj.id)}
                                    className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Article Editor Modal Overlay */}
          {editorOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div onClick={handleCloseEditor} className="absolute inset-0 bg-brand-blue/90 backdrop-blur-sm" />

              <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-black text-brand-orange tracking-widest uppercase">ÉDITEUR BLOG</span>
                    <h4 className="font-display font-black text-2xl text-brand-blue uppercase mt-1">
                      {editingArticle ? "MODIFIER L'ARTICLE" : "CONCEVOIR UN NOUVEL ARTICLE"}
                    </h4>
                  </div>
                  <button onClick={handleCloseEditor} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                    <X className="w-6 h-6 text-brand-blue" />
                  </button>
                </div>

                <form onSubmit={handleSubmitArticle} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                  {articleFormError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{articleFormError}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Titre de l'article *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: 5 méthodes digitales pour optimiser la conversion..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Catégorie *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as "Conseil" | "Méthode")}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange cursor-pointer"
                      >
                        <option value="Conseil">Conseil</option>
                        <option value="Méthode">Méthode</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Durée de lecture estimée *</label>
                      <input
                        type="text"
                        required
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                        placeholder="Ex: 5 min"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Auteur</label>
                      <input
                        type="text"
                        disabled
                        value="Soumahoro Abdul"
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl font-medium text-sm text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Illustration Image Field */}
                  <div className="space-y-3 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider">
                        Image d'illustration de l'article
                      </label>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-blue hover:bg-brand-orange text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {articleImageLoading ? "Compression..." : "Importer une image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleArticleImageUpload}
                          disabled={articleImageLoading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={articleImageUrl}
                      onChange={(e) => setArticleImageUrl(e.target.value)}
                      placeholder="Ou collez une URL d'image (https://...)"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-brand-orange"
                    />

                    {articleImageUrl && (
                      <div className="relative aspect-[16/9] max-h-48 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <SafeImage
                          src={articleImageUrl}
                          alt="Aperçu de l'illustration"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setArticleImageUrl("")}
                          className="absolute top-2 right-2 px-3 py-1.5 bg-white/95 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-black text-brand-blue uppercase tracking-wider">
                      <label>Contenu de l'article (Markdown) *</label>
                      <span className="text-slate-400 normal-case font-medium">
                        Astuce : utilisez ![légende](url) pour insérer des images dans le texte
                      </span>
                    </div>
                    <textarea
                      required
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Rédigez votre conseil ou méthode ici..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange font-mono"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseEditor}
                      className="px-6 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all text-sm cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={savingArticle || articleImageLoading}
                      className="px-6 py-3 bg-brand-blue text-white hover:bg-brand-orange disabled:opacity-60 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-blue/10"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {savingArticle
                        ? "Enregistrement..."
                        : editingArticle
                        ? "Enregistrer les modifications"
                        : "Publier l'article"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Project Editor Modal Overlay */}
          {projectEditorOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div onClick={handleCloseProjectEditor} className="absolute inset-0 bg-brand-blue/90 backdrop-blur-sm" />

              <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-black text-brand-orange tracking-widest uppercase">PORTFOLIO RÉALISATIONS</span>
                    <h4 className="font-display font-black text-2xl text-brand-blue uppercase mt-1">
                      {editingProject ? "MODIFIER LA RÉALISATION" : "AJOUTER UNE RÉALISATION"}
                    </h4>
                  </div>
                  <button onClick={handleCloseProjectEditor} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                    <X className="w-6 h-6 text-brand-blue" />
                  </button>
                </div>

                <form onSubmit={handleSubmitProject} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                  {projectFormError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{projectFormError}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Titre du projet *</label>
                      <input
                        type="text"
                        required
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Ex: Plateforme E-Commerce Ivoire Mode"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Catégorie *</label>
                      <select
                        value={projectCategory}
                        onChange={(e) => setProjectCategory(e.target.value as ProjectCategory)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange cursor-pointer"
                      >
                        <option value="Site Vitrine">Site Vitrine</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Application Web">Application Web</option>
                        <option value="Portail & Blog">Portail & Blog</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Client / Secteur *</label>
                      <input
                        type="text"
                        required
                        value={projectClient}
                        onChange={(e) => setProjectClient(e.target.value)}
                        placeholder="Ex: Maison Aethel Abidjan"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">Année *</label>
                      <input
                        type="text"
                        required
                        value={projectYear}
                        onChange={(e) => setProjectYear(e.target.value)}
                        placeholder="2026"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  {/* Project Preview Image */}
                  <div className="space-y-3 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider">
                        Capture / Visuel du projet *
                      </label>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-blue hover:bg-brand-orange text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {projectImageLoading ? "Compression..." : "Importer une image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleProjectImageUpload}
                          disabled={projectImageLoading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={projectImageUrl}
                      onChange={(e) => setProjectImageUrl(e.target.value)}
                      placeholder="Ou collez une URL d'image (https://...)"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-brand-orange"
                    />

                    {projectImageUrl && (
                      <div className="relative aspect-[16/9] max-h-48 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <SafeImage
                          src={projectImageUrl}
                          alt="Aperçu du projet"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setProjectImageUrl("")}
                          className="absolute top-2 right-2 px-3 py-1.5 bg-white/95 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">
                        Technologies (séparées par des virgules)
                      </label>
                      <input
                        type="text"
                        value={projectTechnologies}
                        onChange={(e) => setProjectTechnologies(e.target.value)}
                        placeholder="React, TypeScript, Tailwind CSS, Firebase"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">
                        Lien vers le site (optionnel)
                      </label>
                      <input
                        type="url"
                        value={projectLiveUrl}
                        onChange={(e) => setProjectLiveUrl(e.target.value)}
                        placeholder="https://mon-projet.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={projectFeatured}
                      onChange={(e) => setProjectFeatured(e.target.checked)}
                      className="w-4 h-4 accent-brand-orange rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-brand-blue">
                      Mettre cette réalisation en avant (en grand format en tête de grille)
                    </span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-brand-blue uppercase tracking-wider block">
                      Description & Résultats obtenus *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Décrivez le besoin du client, l'architecture choisie et les résultats..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseProjectEditor}
                      className="px-6 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all text-sm cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={savingProject || projectImageLoading}
                      className="px-6 py-3 bg-brand-blue text-white hover:bg-brand-orange disabled:opacity-60 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-blue/10"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {savingProject
                        ? "Enregistrement..."
                        : editingProject
                        ? "Mettre à jour"
                        : "Publier la réalisation"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

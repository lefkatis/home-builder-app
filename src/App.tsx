import { useState, useEffect } from 'react';
import { 
  Home, 
  Sun, 
  Moon, 
  Monitor, 
  Database,
  Sparkles
} from 'lucide-react';
import MyHouseDashboard from './components/MyHouseDashboard';
import { 
  CustomProjectData, 
  QuestionnaireAnswers, 
  CustomProvision 
} from './types/questionnaire';
import { 
  loadProjectData, 
  checkBackendHealth, 
  saveQuestionnaire, 
  updateProvision, 
  updateProcurement, 
  addCustomProvision, 
  deleteProvision,
  getLocalFallbackData 
} from './services/api';

export default function App() {
  const [projectData, setProjectData] = useState<CustomProjectData>(() => getLocalFallbackData());
  const [isSqliteConnected, setIsSqliteConnected] = useState<boolean>(false);

  // Theme state: dark | light | system
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('hpb_theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('hpb_theme', theme);

    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Load project from SQLite backend on mount
  useEffect(() => {
    checkBackendHealth().then(res => setIsSqliteConnected(res.isOnline));
    loadProjectData().then(({ data, isFromSqlite }) => {
      setProjectData(data);
      setIsSqliteConnected(isFromSqlite);
    });
  }, []);

  const handleSaveQuestionnaire = async (answers: QuestionnaireAnswers) => {
    const { data, isSavedToSqlite } = await saveQuestionnaire(answers);
    setProjectData(data);
    setIsSqliteConnected(isSavedToSqlite);
  };

  const handleToggleProvision = async (provisionId: string, completed: boolean) => {
    await updateProvision('project_default', provisionId, { completed });
    setProjectData(prev => ({
      ...prev,
      provisions: prev.provisions.map(p => p.id === provisionId ? { ...p, completed } : p)
    }));
  };

  const handleToggleProcurement = async (itemId: string, purchased: boolean) => {
    await updateProcurement('project_default', itemId, { purchased });
    setProjectData(prev => ({
      ...prev,
      procurement: prev.procurement.map(i => i.id === itemId ? { ...i, purchased } : i)
    }));
  };

  const handleAddProvision = async (provision: Omit<CustomProvision, 'id'>) => {
    const created = await addCustomProvision('project_default', provision);
    setProjectData(prev => ({
      ...prev,
      provisions: [...prev.provisions, created]
    }));
  };

  const handleDeleteProvision = async (provisionId: string) => {
    await deleteProvision('project_default', provisionId);
    setProjectData(prev => ({
      ...prev,
      provisions: prev.provisions.filter(p => p.id !== provisionId)
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans p-2 md:p-4 overflow-hidden flex flex-col transition-colors duration-200">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 gap-4">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-300 dark:border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Home size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 dark:from-indigo-400 to-cyan-500 dark:to-cyan-400">
                  Home Builder App
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Sparkles size={11} />
                  Smart Home & Electrical
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs tracking-wide">
                Ερωτηματολόγιο Επιλογής Προνοιών, Αυτοματισμός & SQLite Database
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            
            {/* Database indicator */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              isSqliteConnected 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}>
              <Database size={13} className={isSqliteConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'} />
              <span>{isSqliteConnected ? 'SQLite: Συνδεδεμένη' : 'Τοπική Προσωρινή Μνήμη'}</span>
            </div>

            {/* Dark / Light / System Theme Switcher */}
            <div className="flex items-center bg-neutral-200/80 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-300 dark:border-neutral-800 text-xs">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'bg-white dark:bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                title="Φωτεινό Θέμα (Light)"
              >
                <Sun size={15} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white dark:bg-neutral-800 text-indigo-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                title="Σκοτεινό Θέμα (Dark)"
              >
                <Moon size={15} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'system' ? 'bg-white dark:bg-neutral-800 text-cyan-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                title="Θέμα Συστήματος (System)"
              >
                <Monitor size={15} />
              </button>
            </div>

          </div>
        </header>

        {/* Dedicated Home Provisions Dashboard */}
        <MyHouseDashboard
          projectData={projectData}
          isSqliteConnected={isSqliteConnected}
          onSaveQuestionnaire={handleSaveQuestionnaire}
          onToggleProvision={handleToggleProvision}
          onToggleProcurement={handleToggleProcurement}
          onAddProvision={handleAddProvision}
          onDeleteProvision={handleDeleteProvision}
        />

      </div>
    </div>
  );
}

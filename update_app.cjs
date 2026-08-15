const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`  const [isSaving, setIsSaving] = useState(false);`,
`  const [isSaving, setIsSaving] = useState(false);
  const [dbSetupIncomplete, setDbSetupIncomplete] = useState(false);`
);

code = code.replace(
`  // Fetch documents from Supabase with fallback
  const loadDocs = async (overrideUserId?: string | null) => {
    const targetUserId = overrideUserId !== undefined ? overrideUserId : user?.id;
    const { docs } = await fetchDocuments(targetUserId || undefined);
    setDocuments(docs);
  };`,
`  // Fetch documents from Supabase with fallback
  const loadDocs = async (overrideUserId?: string | null) => {
    const targetUserId = overrideUserId !== undefined ? overrideUserId : user?.id;
    const { docs, error } = await fetchDocuments(targetUserId || undefined);
    
    if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
      setDbSetupIncomplete(true);
      return; // Do not use silent fallback when setup is just missing
    }
    
    setDbSetupIncomplete(false);
    setDocuments(docs);
  };`
);

code = code.replace(
`  const activeDoc = documents.find((d) => d.id === activeDocId);

  return (`,
`  const activeDoc = documents.find((d) => d.id === activeDocId);

  if (dbSetupIncomplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
          <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Database Setup Incomplete</h2>
          <p className="text-slate-600 mb-6 text-sm">
            DocuFlow database setup is incomplete. Please run the Supabase database migration in your Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  return (`
);

code = code.replace(
`import { 
  FileText, 
  Star, 
  Clock, 
  Trash2, 
  Folder, 
  Plus, 
  Layers 
} from 'lucide-react';`,
`import { 
  FileText, 
  Star, 
  Clock, 
  Trash2, 
  Folder, 
  Plus, 
  Layers,
  Database
} from 'lucide-react';`
);

fs.writeFileSync('src/App.tsx', code);

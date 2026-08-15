const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

code = code.replace(
`export async function fetchDocuments(userId?: string): Promise<{ docs: DocuFlowDocument[]; isLocal: boolean }> {`,
`export async function fetchDocuments(userId?: string): Promise<{ docs: DocuFlowDocument[]; isLocal: boolean; error?: any }> {`
);

code = code.replace(
`      console.warn('Supabase fetch docs error, using local/cached docs:', error.message);
      const local = getLocalDocuments().filter(d => d.user_id === userId || d.user_id === 'guest');
      return { docs: local, isLocal: true };`,
`      console.warn('Supabase fetch docs error:', error.message);
      if (error.code === '42P01' || error.message.includes('Could not find the table')) {
        return { docs: [], isLocal: false, error };
      }
      const local = getLocalDocuments().filter(d => d.user_id === userId || d.user_id === 'guest');
      return { docs: local, isLocal: true, error };`
);

code = code.replace(
`    console.error('Fetch documents exception:', err);
    return { docs: getLocalDocuments(), isLocal: true };`,
`    console.error('Fetch documents exception:', err);
    return { docs: getLocalDocuments(), isLocal: true, error: err };`
);

fs.writeFileSync('src/lib/supabase.ts', code);

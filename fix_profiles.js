const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

code = code.replace(
`  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) {
    console.warn('Profiles table sync notice:', error);
  }`,
`  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) {
    if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
      // The user has not created the table yet. 
      // Do not log excessively, let the frontend 'dbSetupIncomplete' handle it via fetchDocuments
      console.warn('Profiles table missing. Need to run SQL migration.');
    } else {
      console.warn('Profiles table sync notice:', error);
    }
  }`
);

fs.writeFileSync('src/lib/supabase.ts', code);

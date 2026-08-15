const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');
code = code.replace(
`  try {
    await supabase.from('profiles').upsert(profile);
  } catch (err) {
    console.warn('Profiles table sync notice:', err);
  }`,
`  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) {
    console.warn('Profiles table sync notice:', error);
  }`
);
fs.writeFileSync('src/lib/supabase.ts', code);

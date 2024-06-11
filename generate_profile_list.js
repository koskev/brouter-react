import { readdir, writeFile } from 'fs/promises';
import { basename, extname } from 'path';

const profile_dir = "public/profiles";
const output_file = "public/profiles/profiles.json";

async function generate_profile_list() {
  try {
    const files = await readdir(profile_dir);
    const profile_files = files.filter(file => file.endsWith('.brf')).map(file => basename(file, extname(file)));

    await writeFile(output_file, JSON.stringify(profile_files, null, 2), 'utf8');
    console.log('Profile list generated:', output_file);
  } catch (err) {
    console.error('Error generating profile list:', err);
    process.exit(1);
  }
}

generate_profile_list();

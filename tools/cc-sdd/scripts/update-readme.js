#!/usr/bin/env node

/**
 * Update README script for cc-ssd-enh
 * Maintains proper attribution to original author while updating enhanced version info
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const README_PATH = path.join(__dirname, '..', 'README.md');

function updateReadme() {
  console.log('🔄 Updating README.md with latest package information...');
  
  // Read package.json
  const packageData = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const { version, name, description } = packageData;
  
  console.log(`📦 Package: ${name} v${version}`);
  
  // Read current README
  let readme = fs.readFileSync(README_PATH, 'utf8');
  
  // Update version references
  readme = readme.replace(/cc-ssd-enh v[\d.]+/g, `cc-ssd-enh v${version}`);
  readme = readme.replace(/\*\*Enhanced Release v[\d.]+\*\*/g, `**Enhanced Release v${version}**`);
  
  // Ensure proper attribution is maintained
  const attributionSection = `## 🙏 Credits & Attribution

### Original Author
This enhanced version is built upon the **excellent foundation** of [cc-sdd](https://github.com/gotalab/cc-sdd) created by **[Gota](https://github.com/gotalab)**. 

**🌟 Original Project**: https://github.com/gotalab/cc-sdd  
**👨‍💻 Original Author**: [Gota](https://github.com/gotalab)  
**📦 Original NPM**: [cc-sdd](https://www.npmjs.com/package/cc-sdd)

All core spec-driven development methodology, AI-DLC concepts, and foundational architecture are **credited to the original author**.

### Enhanced Version  
**🚀 Enhanced by**: [UntaDotMy](https://github.com/UntaDotMy)  
**📦 Enhanced NPM**: [cc-ssd-enh](https://www.npmjs.com/package/cc-ssd-enh)  
**🏠 Enhanced Repository**: https://github.com/UntaDotMy/Cursor-Spec-Development

**✨ Enhancements Added**: WebSearch integration, knowledge management, error documentation, self-review mistake detection, and knife surgery coding capabilities.`;
  
  // Replace credits section if it exists
  const creditsRegex = /## 🙏 Credits[\s\S]*?(?=##|$)/;
  if (creditsRegex.test(readme)) {
    readme = readme.replace(creditsRegex, attributionSection + '\n\n');
  }
  
  // Update NPM package links
  readme = readme.replace(
    /\[cc-ssd-enh\]\(https:\/\/www\.npmjs\.com\/package\/cc-ssd-enh[^)]*\)/g,
    `[cc-ssd-enh](https://www.npmjs.com/package/cc-ssd-enh)`
  );
  
  // Write updated README
  fs.writeFileSync(README_PATH, readme);
  
  console.log('✅ README.md updated successfully!');
  console.log(`📄 Version: ${version}`);
  console.log(`🔗 NPM: https://www.npmjs.com/package/${name}`);
  console.log(`🙏 Original by Gota: https://github.com/gotalab/cc-sdd`);
}

// Run the update
updateReadme();

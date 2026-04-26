const fs = require('fs');
const path = require('path');

const SKILL_DIRECTORIES = [
  'src/intelligence/ai-skills',
  'src/intelligence/ai-for-managers',
  'src/intelligence/analytics',
  'src/intelligence/automation',
  'src/intelligence/communication',
  'src/intelligence/diagnosis',
  'src/intelligence/drift',
  'src/intelligence/maintenance',
  'src/intelligence/selfheal',
  'src/ops/automation',
  'src/ops/communication',
  'src/ops/deployment',
  'src/ops/maintenance',
  'src/ops/selfheal',
  'src/ops/recovery',
  'src/security/defense',
  'src/security/compliance',
  'src/security/governance',
  'src/security/rbac',
  'src/core/iot',
  'src/core/traceability',
  'src/core/supply-chain',
  'src/external/sales',
];

function scanDir(dir, prefix = '') {
  const skills = [];
  if (!fs.existsSync(dir)) return skills;
  
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const subSkills = scanDir(fullPath, prefix + file + '/');
        skills.push(...subSkills);
      } else if (file.endsWith('.skill.js')) {
        const category = prefix.replace(/\/$/, '') || 'uncategorized';
        const skillName = file.replace('.skill.js', '');
        const modulePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
        
        skills.push({
          name: skillName,
          path: modulePath,
          category: category,
          require: () => require(fullPath)
        });
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
  return skills;
}

function getAllSkills() {
  const allSkills = [];
  const baseDir = path.join(__dirname, '..');
  
  for (const dir of SKILL_DIRECTORIES) {
    const fullPath = path.join(baseDir, dir);
    const found = scanDir(fullPath);
    allSkills.push(...found);
  }
  
  return allSkills;
}

const skillRegistry = {
  skills: null,
  
  initialize() {
    this.skills = getAllSkills();
  },
  
  getSkill(name) {
    return this.skills.find(s => s.name === name);
  },
  
  getSkillsByCategory(category) {
    return this.skills.filter(s => s.category === category);
  },
  
  getCategories() {
    return [...new Set(this.skills.map(s => s.category))];
  },
  
  count() {
    return this.skills.length;
  },
  
  getSkillWithDeps(name) {
    const skill = this.getSkill(name);
    if (!skill) return null;
    
    try {
      const loaded = skill.require();
      return { ...skill, instance: loaded };
    } catch (e) {
      return { ...skill, error: e.message };
    }
  }
};

skillRegistry.initialize();

module.exports = skillRegistry;

if (require.main === module) {
  console.log('=== EcoSynTech Skill Registry ===');
  console.log(`Total Skills: ${skillRegistry.count()}`);
  console.log('\nCategories:');
  skillRegistry.getCategories().forEach(cat => {
    const count = skillRegistry.getSkillsByCategory(cat).length;
    console.log(`  ${cat}: ${count}`);
  });
  console.log('\nSample Skills:');
  skillRegistry.skills.slice(0, 5).forEach(s => {
    console.log(`  - ${s.name} (${s.category})`);
  });
}
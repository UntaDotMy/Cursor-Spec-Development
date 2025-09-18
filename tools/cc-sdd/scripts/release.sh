#!/bin/bash

# Enhanced cc-ssd-enh Release Script
# This script helps create new releases with proper versioning

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 cc-ssd-enh Release Script${NC}"
echo -e "Enhanced version of cc-sdd by Gota (https://github.com/gotalab/cc-sdd)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Run this script from tools/cc-sdd directory${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "📦 Current version: ${YELLOW}v$CURRENT_VERSION${NC}"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ Error: You have uncommitted changes. Please commit or stash them first.${NC}"
  exit 1
fi

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  Warning: You're on branch '$BRANCH', not 'main'. Continue? (y/N)${NC}"
  read -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "Select release type:"
echo "1) Patch (bug fixes) - $CURRENT_VERSION -> $(npm version patch --dry-run | sed 's/v//')"
echo "2) Minor (new features) - $CURRENT_VERSION -> $(npm version minor --dry-run | sed 's/v//')"
echo "3) Major (breaking changes) - $CURRENT_VERSION -> $(npm version major --dry-run | sed 's/v//')"
echo "4) Custom version"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
  1)
    RELEASE_TYPE="patch"
    ;;
  2)
    RELEASE_TYPE="minor"
    ;;
  3)
    RELEASE_TYPE="major"
    ;;
  4)
    read -p "Enter custom version (e.g., 2.0.0): " CUSTOM_VERSION
    if [[ ! $CUSTOM_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo -e "${RED}❌ Error: Invalid version format. Use semantic versioning (x.y.z)${NC}"
      exit 1
    fi
    ;;
  *)
    echo -e "${RED}❌ Error: Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}🔍 Pre-release checks...${NC}"

# Run tests
echo "Running tests..."
npm test

# Build package
echo "Building package..."
npm run build

# Test CLI
echo "Testing CLI..."
node dist/cli.js --version

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Update version
if [ "$choice" == "4" ]; then
  echo -e "${YELLOW}📝 Updating version to $CUSTOM_VERSION...${NC}"
  npm version $CUSTOM_VERSION --no-git-tag-version
  NEW_VERSION=$CUSTOM_VERSION
else
  echo -e "${YELLOW}📝 Updating version ($RELEASE_TYPE)...${NC}"
  NEW_VERSION=$(npm version $RELEASE_TYPE --no-git-tag-version | sed 's/v//')
fi

echo -e "🎉 Version updated to ${GREEN}v$NEW_VERSION${NC}"

# Update changelog
echo -e "${YELLOW}📝 Updating CHANGELOG.md...${NC}"
DATE=$(date +"%Y-%m-%d")

# Create changelog entry
cat > changelog_temp.md << EOF
## [$NEW_VERSION] - $DATE

### Enhanced Features
- WebSearch integration for research and planning
- Knowledge management with structured documentation
- Self-review & mistake detection before testing
- Error documentation with web-searched solutions
- Knife surgery coding with minimal impact

### Changes in this release
- Updated package version to $NEW_VERSION
- Maintained compatibility with all supported agents (Claude Code, Cursor IDE, Gemini CLI)
- Enhanced CI/CD pipeline with automated releases

EOF

# Prepend to existing changelog
if [ -f "CHANGELOG.md" ]; then
  sed -i.bak '3r changelog_temp.md' CHANGELOG.md
else
  cat changelog_temp.md > CHANGELOG.md
  echo "" >> CHANGELOG.md
  echo "## Credits" >> CHANGELOG.md
  echo "This enhanced version builds upon [cc-sdd](https://github.com/gotalab/cc-sdd) by [Gota](https://github.com/gotalab)." >> CHANGELOG.md
fi

rm changelog_temp.md
if [ -f "CHANGELOG.md.bak" ]; then
  rm CHANGELOG.md.bak
fi

# Commit changes
echo -e "${YELLOW}📝 Committing changes...${NC}"
git add package.json CHANGELOG.md package-lock.json
git commit -m "chore: release v$NEW_VERSION

Enhanced cc-ssd-enh with WebSearch integration, knowledge management, 
self-review mistake detection, and knife surgery coding capabilities.

Based on cc-sdd by Gota (https://github.com/gotalab/cc-sdd)"

echo -e "${GREEN}✅ Release commit created${NC}"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Push to main branch: ${GREEN}git push origin main${NC}"
echo "2. GitHub Actions will automatically:"
echo "   - Create GitHub release with changelog"
echo "   - Publish to NPM"
echo "   - Update release badges"
echo ""
echo -e "📦 NPM Package: https://www.npmjs.com/package/cc-ssd-enh"
echo -e "🏠 Repository: https://github.com/UntaDotMy/Cursor-Spec-Development"
echo -e "🙏 Original by: https://github.com/gotalab/cc-sdd"
echo ""
echo -e "${GREEN}🎉 Release v$NEW_VERSION is ready!${NC}"

@echo off
cd /d "c:\Users\DELL\Documents\Livefoot"
git add index.html src/main.tsx
git commit -m "Remove diagnostic text from UI"
git push origin main
echo Done!

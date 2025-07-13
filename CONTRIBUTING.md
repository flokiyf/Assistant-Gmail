# Guide de Contribution - Assistant Gmail

Merci de votre intérêt pour contribuer à Assistant Gmail ! Ce guide vous aidera à comprendre comment participer au projet.

## Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Connaissance de TypeScript
- Un compte GitHub

## Comment contribuer

### 1. Configurer l'environnement de développement

1. Forkez le repository
2. Clonez votre fork :
```bash
git clone https://github.com/VOTRE-USERNAME/Assistant-Gmail.git
cd Assistant-Gmail
```
3. Installez les dépendances :
```bash
npm install
# ou
yarn install
```

### 2. Process de contribution

1. Créez une nouvelle branche pour votre fonctionnalité :
```bash
git checkout -b feature/nom-de-votre-feature
```

2. Effectuez vos modifications en suivant les conventions de code :
   - Utilisez TypeScript strict
   - Suivez les règles ESLint/Prettier du projet
   - Commentez votre code quand nécessaire

3. Testez vos modifications :
```bash
npm run test
# ou
yarn test
```

4. Committez vos changements :
```bash
git add .
git commit -m "feat: description de votre modification"
```

5. Poussez vers votre fork :
```bash
git push origin feature/nom-de-votre-feature
```

6. Ouvrez une Pull Request vers la branche `main` du repository principal

### 3. Conventions de commit

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/). Les types principaux sont :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Modification de la documentation
- `style:` - Changements de formatage
- `refactor:` - Refactoring du code
- `test:` - Ajout ou modification de tests
- `chore:` - Autres modifications

### 4. Guidelines pour les Pull Requests

- Donnez un titre clair et descriptif à votre PR
- Incluez une description détaillée des changements
- Référencez les issues concernées si applicable
- Assurez-vous que tous les tests passent
- Ajoutez des tests pour les nouvelles fonctionnalités

### 5. Signalement de bugs

Si vous trouvez un bug, créez une issue en utilisant le template de bug report et incluez :

- Une description claire du problème
- Les étapes pour reproduire
- Le comportement attendu vs actuel
- Des captures d'écran si pertinent
- Votre environnement (OS, navigateur, etc.)

### 6. Suggestions de fonctionnalités

Pour proposer une nouvelle fonctionnalité :

1. Vérifiez d'abord que cette fonctionnalité n'a pas déjà été proposée
2. Créez une issue avec le template de feature request
3. Expliquez clairement l'utilité et le fonctionnement souhaité

## Code de conduite

- Soyez respectueux et bienveillant envers les autres contributeurs
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Faites preuve d'empathie envers les autres membres

## Questions ou besoin d'aide ?

N'hésitez pas à :
- Ouvrir une issue pour toute question
- Rejoindre les discussions GitHub du projet
- Contacter les mainteneurs

## Licence

En contribuant à ce projet, vous acceptez que vos contributions soient sous la même licence que le projet.

---

Merci de contribuer à Assistant Gmail ! 🚀

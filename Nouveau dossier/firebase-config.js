/*
  @tweakable Remplacer par la configuration de votre projet Firebase
  Pour obtenir ces informations :
  1. Allez sur la console Firebase (console.firebase.google.com)
  2. Sélectionnez votre projet
  3. Allez dans les "Paramètres du projet" (icône d'engrenage)
  4. Dans l'onglet "Général", section "Vos applications",
     cherchez une application web ou créez-en une.
  5. Copiez l'objet de configuration `firebaseConfig` ici.
*/
const firebaseConfig = {
  apiKey: "AIzaSyBOozK7OwjHNYrhQW6CF5WwZ8RcKuz6NzE",
  authDomain: "my-gym-598f6.firebaseapp.com",
  projectId: "my-gym-598f6",
  storageBucket: "my-gym-598f6.appspot.com",
  messagingSenderId: "903623864930",
  appId: "1:903623864930:web:f79764fd369b3cd2d1d73b"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Créer des alias pour les services Firebase pour un accès facile
const auth = firebase.auth();
const db = firebase.firestore();
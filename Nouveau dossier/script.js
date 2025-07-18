// =================================================================
// Fonctions Utilitaires et d'Aide
// =================================================================

/**
 * Affiche une alerte (feedback) à l'utilisateur et la fait disparaître après un délai.
 * @param {HTMLElement} element - L'élément HTML où afficher le message.
 * @param {string} message - Le message à afficher.
 * @param {string} type - Le type d'alerte ('success' ou 'danger').
 */
function showFeedback(element, message, type = 'success') {
    element.className = `feedback-alert alert-${type}`;
    element.textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 3000);
}

let notificationTimeout;

/**
 * Affiche une notification personnalisée au centre de l'écran.
 * @param {string} message - Le message à afficher.
 * @param {string} type - 'success', 'danger', or 'warning'.
 */
function showNotification(message, type = 'success') {
    const container = document.getElementById('custom-notification-container');
    if (!container) return;

    const card = container.querySelector('.notification-card');
    const iconEl = container.querySelector('.notification-icon i');
    const titleEl = container.querySelector('.notification-title');
    const messageEl = container.querySelector('.notification-message');
    
    // Clear previous timeout if a notification is already showing
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Set message
    messageEl.textContent = message;

    // Set type, icon, and title
    card.className = `notification-card ${type}`;
    let iconName = 'info';
    let title = 'Information';

    if (type === 'success') {
        iconName = 'check-circle';
        title = 'Succès';
    } else if (type === 'danger') {
        iconName = 'alert-octagon';
        title = 'Erreur';
    } else if (type === 'warning') {
        iconName = 'alert-triangle';
        title = 'Avertissement';
    }

    iconEl.setAttribute('data-lucide', iconName);
    lucide.createIcons({ nodes: [iconEl] });
    titleEl.textContent = title;

    // Show notification
    container.classList.add('visible');

    // Auto-hide after 4 seconds
    notificationTimeout = setTimeout(() => {
        container.classList.remove('visible');
    }, 4000);
}

/**
 * Affiche une notification toast.
 * @param {string} message - Le message à afficher.
 * @param {string} type - 'success' ou 'danger'.
 * @param {number} duration - Durée en ms avant la disparition.
 */
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons({
        nodes: [toast.querySelector('i')]
    });
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/**
 * Gère l'ouverture et la fermeture des modales.
 */
function setupModals() {
    const allModals = document.querySelectorAll('.modal');
    
    // Fermer la modale en cliquant sur le bouton de fermeture ou sur l'arrière-plan
    allModals.forEach(modal => {
        const dismissButtons = modal.querySelectorAll('[data-dismiss-modal]');
        dismissButtons.forEach(button => {
            button.addEventListener('click', () => modal.classList.remove('visible'));
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                 modal.classList.remove('visible');
            }
        });
    });
}

/**
 * Gère la navigation par onglets.
 */
function setupTabs() {
    const tabContainer = document.querySelector('.tabs');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.tab-button');
        if (!targetButton) return;

        // Mettre à jour les boutons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        targetButton.classList.add('active');

        // Mettre à jour les panneaux
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        const targetPaneId = targetButton.dataset.target;
        document.querySelector(targetPaneId)?.classList.add('active');
    });
}

/**
 * Initialise la logique pour la notification personnalisée (bouton de fermeture, etc.).
 */
function setupCustomNotifications() {
    const container = document.getElementById('custom-notification-container');
    if (!container) return;
    const closeBtn = container.querySelector('.notification-close-btn');

    const hideNotification = () => {
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        container.classList.remove('visible');
    };

    closeBtn.addEventListener('click', hideNotification);
    
    // Fermer en cliquant sur l'arrière-plan
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            hideNotification();
        }
    });
}

// =================================================================
// Logique d'Authentification et de Redirection
// =================================================================

/**
 * Vérifie si un utilisateur est un administrateur autorisé.
 * @param {object} user - L'objet utilisateur de Firebase Auth.
 * @returns {Promise<boolean>} - Vrai si l'utilisateur est un admin, sinon faux.
 */
async function isAdmin(user) {
    if (!user) return false;
    // Un utilisateur est admin si son email est dans la collection 'admins'.
    const adminQuery = await db.collection('admins').where('email', '==', user.email).get();
    return !adminQuery.empty;
}

/**
 * Gère la redirection initiale depuis index.html.
 * Vérifie l'état de l'authentification et redirige vers login.html ou dashboard.html.
 */
function handleAuthRedirect() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userIsAdmin = await isAdmin(user);
            if (userIsAdmin) {
                window.location.replace('dashboard.html');
            } else {
                // Si l'utilisateur est connecté mais n'est pas admin, on le déconnecte.
                await auth.signOut();
                // On ajoute un message d'erreur dans l'URL pour l'afficher sur la page de connexion
                window.location.replace('login.html?error=auth');
            }
        } else {
            window.location.replace('login.html');
        }
    });
}

/**
 * Affiche un modal de confirmation et exécute un callback si confirmé.
 * @param {string} title - Le titre du modal.
 * @param {string} message - Le message de confirmation.
 * @param {function} onConfirm - La fonction à exécuter si l'utilisateur confirme.
 */
function showConfirmation(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const titleEl = document.getElementById('confirmationModalTitle');
    const messageEl = document.getElementById('confirmationModalMessage');
    const confirmBtn = document.getElementById('confirmActionBtn');

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Utiliser .cloneNode(true) pour retirer les anciens écouteurs d'événements
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const handleConfirm = () => {
        onConfirm();
        modal.classList.remove('visible');
    };

    newConfirmBtn.addEventListener('click', handleConfirm);
    
    modal.classList.add('visible');
}

/**
 * Initialise la page de connexion (login.html).
 */
function setupLoginPage() {
    // Seed the first admin if none exist
    const seedFirstAdmin = async () => {
        const adminRef = db.collection('admins');
        const snapshot = await adminRef.limit(1).get();
        if (snapshot.empty) {
            console.log('No admins found. Seeding initial admin...');
            try {
                await adminRef.add({
                    email: 'belyagoubi@gmail.com',
                    addedBy: 'system-initialization'
                });
                console.log('Initial admin seeded: belyagoubi@gmail.com');
            } catch (error) {
                console.error('Error seeding initial admin:', error);
            }
        }
    };
    seedFirstAdmin();

    // Vérifie si l'utilisateur est déjà connecté et admin, si oui, redirige vers le dashboard.
    auth.onAuthStateChanged(async(user) => {
        if (user && await isAdmin(user)) {
            window.location.replace('dashboard.html');
        }
    });

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginSpinner = document.getElementById('login-spinner');
    const loginButtonText = document.getElementById('login-button-text');
    
    // Affiche un message d'erreur si la redirection contenait une erreur d'autorisation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'auth') {
        loginError.textContent = 'Accès non autorisé. Seuls les administrateurs peuvent se connecter.';
        loginError.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginSpinner.classList.remove('hidden');
        loginButtonText.classList.add('hidden');
        loginError.classList.add('hidden');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Tente de connecter l'utilisateur
            await auth.signInWithEmailAndPassword(email, password);
            // La redirection est gérée par onAuthStateChanged dans handleAuthRedirect
            // que nous rappelons ici pour forcer la vérification
            handleAuthRedirect();
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Si l'utilisateur n'existe pas, on tente de le créer
                try {
                    await auth.createUserWithEmailAndPassword(email, password);
                    handleAuthRedirect();
                } catch (createError) {
                    loginError.textContent = createError.message;
                    loginError.classList.remove('hidden');
                }
            } else {
                loginError.textContent = "Email ou mot de passe incorrect.";
                loginError.classList.remove('hidden');
            }
        } finally {
            loginSpinner.classList.add('hidden');
            loginButtonText.classList.remove('hidden');
        }
    });
}

// =================================================================
// Logique du Tableau de Bord (Dashboard)
// =================================================================

let currentUser = null; // Stocker l'utilisateur courant pour le dashboard

/**
 * Initialise la page du tableau de bord (dashboard.html).
 */
function setupDashboardPage() {
    const mainLoader = document.getElementById('main-loader');
    const mainContent = document.getElementById('main-content');
    
    auth.onAuthStateChanged(async (user) => {
        if (user && await isAdmin(user)) {
            currentUser = user;
            mainLoader.classList.add('hidden');
            mainContent.classList.remove('hidden');
            document.getElementById('user-email').textContent = user.email;
            
            // Remplacer les icônes après chargement
            lucide.createIcons();

            // Initialisation des différentes sections
            setupModals();
            setupTabs();
            setupCustomNotifications(); // Initialiser la nouvelle notification
            initDashboardStats(); // Charger les statistiques
            initLogout();
            initAbonnes();
            initAdmins();
            initProduitsEtVentes(); // Initialiser la nouvelle section
        } else {
            // Si pas d'utilisateur ou pas admin, retour à la page de connexion
            window.location.replace('login.html?error=auth');
        }
    });
}

/**
 * Charge les statistiques du tableau de bord.
 */
async function initDashboardStats() {
    const statsLoader = document.getElementById('stats-loader');
    const statsGrid = document.getElementById('stats-grid');
    
    // Afficher le loader et cacher la grille
    statsLoader.classList.remove('hidden');
    statsGrid.classList.add('hidden');

    try {
        // Récupérer tous les abonnés
        const abonnésSnapshot = await db.collection('abonnes').get();
        const abonnés = abonnésSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculer les statistiques des abonnés
        const totalAbonnés = abonnés.length;
        let actifs = 0;
        let expirés = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Pour une comparaison juste de la date

        abonnés.forEach(abonne => {
            const dateFin = new Date(abonne.dateFin);
            if (dateFin < today) {
                expirés++;
            } else {
                actifs++;
            }
        });

        // Récupérer les paiements du mois en cours
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const paiementsSnapshot = await db.collection('paiements')
            .where('date', '>=', startOfMonth)
            .get();
        
        let totalRevenusMois = 0;
        paiementsSnapshot.forEach(doc => {
            totalRevenusMois += doc.data().montant;
        });

        // Fonction pour animer le comptage des chiffres
        const animateCount = (element, endValue, isCurrency = false) => {
            let startValue = 0;
            const duration = 1500; // 1.5 secondes
            const stepTime = Math.abs(Math.floor(duration / endValue));
            
            const timer = setInterval(() => {
                startValue += 1;
                if (isCurrency) {
                    element.innerHTML = `${startValue.toLocaleString()} <small>DA</small>`;
                } else {
                    element.textContent = startValue;
                }
                if (startValue >= endValue) {
                    clearInterval(timer);
                     if (isCurrency) {
                        element.innerHTML = `${endValue.toLocaleString()} <small>DA</small>`;
                    } else {
                        element.textContent = endValue;
                    }
                }
            }, stepTime > 0 ? stepTime : 1);
            if (endValue === 0) {
                 if (isCurrency) {
                    element.innerHTML = `0 <small>DA</small>`;
                } else {
                    element.textContent = 0;
                }
            }
        };

        // Mettre à jour l'interface avec les nouvelles données
        animateCount(document.getElementById('total-abonnés-stat'), totalAbonnés);
        animateCount(document.getElementById('actifs-stat'), actifs);
        animateCount(document.getElementById('expirés-stat'), expirés);
        animateCount(document.getElementById('revenus-stat'), totalRevenusMois, true);

    } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        showNotification("Impossible de charger les statistiques.", 'danger');
    } finally {
        // Cacher le loader et afficher la grille
        statsLoader.classList.add('hidden');
        statsGrid.classList.remove('hidden');
    }
}

/**
 * Gère la déconnexion.
 */
function initLogout() {
    document.getElementById('logout-button').addEventListener('click', async () => {
        await auth.signOut();
        window.location.replace('login.html');
    });
}

// -----------------------------------------------------------------
// Gestion des Abonnés
// -----------------------------------------------------------------
function initAbonnes() {
    const abonneForm = document.getElementById('abonne-form');
    const abonneModal = document.getElementById('abonneModal');
    const abonneModalLabel = document.getElementById('abonneModalLabel');
    const abonnésList = document.getElementById('abonnés-list');
    const searchInput = document.getElementById('search-abonne-input');
    const dateDebutInput = document.getElementById('date-debut');
    const dateFinInput = document.getElementById('date-fin');

    // Nouveaux éléments pour l'historique de paiement
    const paymentHistoryModal = document.getElementById('paymentHistoryModal');
    const addPaymentForm = document.getElementById('add-payment-form');
    const paymentHistoryList = document.getElementById('payment-history-list');
    const paymentAbonneIdInput = document.getElementById('payment-abonne-id');

    // Calculer la date de fin automatiquement
    dateDebutInput.addEventListener('change', () => {
        if (dateDebutInput.value) {
            const startDate = new Date(dateDebutInput.value);
            // Pour éviter les problèmes de fuseau horaire, nous travaillons en UTC
            startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            dateFinInput.value = endDate.toISOString().split('T')[0];
        } else {
            dateFinInput.value = '';
        }
    });

    // Réinitialiser le formulaire en ouvrant le modal pour un ajout
    document.getElementById('add-abonne-btn').addEventListener('click', () => {
        abonneModalLabel.textContent = 'Ajouter un Abonné';
        abonneForm.reset();
        document.getElementById('abonne-id').value = '';
        document.getElementById('nom').readOnly = false;
        document.getElementById('montant-initial').disabled = false;

        // Pré-remplir la date de début avec aujourd'hui et calculer la date de fin
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        dateDebutInput.value = today.toISOString().split('T')[0];
        dateDebutInput.dispatchEvent(new Event('change')); // Déclenche le calcul de la date de fin
        abonneModal.classList.add('visible');
    });

    let allAbonnes = []; // To store all subscribers from Firestore

    const displayAbonnes = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredAbonnes = allAbonnes.filter(doc => {
            const abonne = doc.data();
            return abonne.nom.toLowerCase().includes(searchTerm);
        });
        
        abonnésList.innerHTML = ''; // Vider la liste existante
        if (filteredAbonnes.length === 0) {
            abonnésList.innerHTML = `<tr><td colspan="5" style="text-align:center;">Aucun abonné correspondant à votre recherche.</td></tr>`;
            return;
        }

        filteredAbonnes.forEach(doc => {
            const abonne = doc.data();
            const isExpired = new Date(abonne.dateFin) < new Date();
            const notFullyPaid = abonne.montantPaye < abonne.montantTotal;
            const fullyPaid = abonne.montantPaye >= abonne.montantTotal;

            let rowClass = '';
            let statusBadges = '';
            if (isExpired) {
                rowClass = 'expired-row'; // You can style this class
                statusBadges += `<span class="badge bg-danger">Expiré</span>`;
            } else {
                statusBadges += `<span class="badge bg-success">Actif</span>`;
            }

            if (notFullyPaid) {
                 rowClass = 'unpaid-row'; // You can style this class
                 statusBadges += `<span class="badge bg-warning">Paiement Incomplet</span>`;
            } else if (fullyPaid) {
                 statusBadges += `<span class="badge bg-success">Paiement Complet</span>`;
            }

            let actionsHtml = `
                <button class="btn btn-sm contracts-history-btn" title="Historique des contrats" data-id="${doc.id}" data-nom="${abonne.nom}"><i data-lucide="file-text"></i></button>
                <button class="btn btn-sm payment-history-btn" title="Historique des paiements" data-id="${doc.id}" data-nom="${abonne.nom}"><i data-lucide="dollar-sign"></i></button>
                <button class="btn btn-sm delete-btn" title="Supprimer l'abonné" data-id="${doc.id}"><i data-lucide="trash-2"></i></button>
            `;

            if (isExpired) {
                actionsHtml = `
                    <button class="btn btn-sm btn-primary renew-btn" data-id="${doc.id}" data-nom="${abonne.nom}">
                        <i data-lucide="refresh-cw" style="width:14px; height:14px;"></i> Renouveler
                    </button>
                ` + actionsHtml;
            }

            const tr = `
                <tr class="${rowClass}">
                    <td data-label="Nom">${abonne.nom}</td>
                    <td data-label="Fin Abonnement">${new Date(abonne.dateFin).toLocaleDateString()}</td>
                    <td data-label="Paiement">${abonne.montantPaye.toFixed(2)} / ${abonne.montantTotal.toFixed(2)} DA</td>
                    <td data-label="Statut">${statusBadges}</td>
                    <td data-label="Actions" class="actions-cell">
                        ${actionsHtml}
                    </td>
                </tr>
            `;
            abonnésList.innerHTML += tr;
        });

        lucide.createIcons();
    };

    // Listen for input on the search field
    searchInput.addEventListener('input', displayAbonnes);

    // Gestion de la soumission du formulaire (ajout/modification)
    abonneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('abonne-id').value;
        const nom = document.getElementById('nom').value;
        const isRenewal = abonneModalLabel.textContent.includes('Renouveler');
        let successMessage = "Opération réussie.";
        
        const abonneData = {
            nom: nom,
            montantTotal: 1500, // Le montant total est fixé à 1500
            dateDebut: document.getElementById('date-debut').value,
            dateFin: document.getElementById('date-fin').value,
        };

        const montantInitialInput = document.getElementById('montant-initial');
        const montantInitial = parseFloat(montantInitialInput.value);

        if (!id || isRenewal) { // Only check for new or renewal, not for edit
            if (isNaN(montantInitial) || montantInitial < 0) {
                showNotification("Veuillez saisir un paiement valide.", 'warning');
                return;
            }
             if (montantInitial > 1500) {
                showNotification("Le paiement ne peut pas dépasser 1500 DA.", 'warning');
                return;
            }
        }

        try {
            if (id && !isRenewal) {
                // Modification d'un abonné existant
                const abonneRef = db.collection('abonnes').doc(id);
                // On met à jour uniquement les champs modifiables dans ce formulaire
                await abonneRef.update({
                    nom: abonneData.nom,
                    dateDebut: abonneData.dateDebut,
                    dateFin: abonneData.dateFin,
                });
                successMessage = "✅ Profil mis à jour avec succès.";
            } else if (id && isRenewal) {
                if (isNaN(montantInitial) || montantInitial < 0) {
                    showNotification("Veuillez saisir un paiement de renouvellement valide.", 'warning');
                    return;
                }
                const newContract = {
                    dateDebut: abonneData.dateDebut,
                    dateFin: abonneData.dateFin,
                    montantTotal: abonneData.montantTotal,
                    montantPaye: montantInitial
                };
                // Renouvellement
                const abonneRef = db.collection('abonnes').doc(id);
                // 1. Mettre à jour l'abonné avec les nouvelles dates et le paiement
                // et ajouter le nouveau contrat à l'historique
                await abonneRef.update({
                    ...abonneData,
                    montantPaye: montantInitial, // Le montant payé est réinitialisé pour la nouvelle période
                    historiqueAbonnements: firebase.firestore.FieldValue.arrayUnion(newContract)
                });
                
                // 2. Ajouter le paiement de renouvellement à l'historique des paiements
                await db.collection('paiements').add({
                    abonne_id: id,
                    montant: montantInitial,
                    date: new Date(),
                    methode: 'Renouvellement',
                    commentaire: `Abonnement renouvelé du ${new Date(abonneData.dateDebut).toLocaleDateString()} au ${new Date(abonneData.dateFin).toLocaleDateString()}`
                });
                successMessage = "✅ Abonnement renouvelé avec succès.";
            } else {
                if (isNaN(montantInitial) || montantInitial < 0) {
                    showNotification("Veuillez saisir un paiement initial valide.", 'warning');
                    return;
                }
                const newContract = {
                    dateDebut: abonneData.dateDebut,
                    dateFin: abonneData.dateFin,
                    montantTotal: abonneData.montantTotal,
                    montantPaye: montantInitial
                };
                // Ajout d'un nouvel abonné
                // 1. Créer l'abonné avec son premier contrat dans l'historique
                const docRef = await db.collection('abonnes').add({
                    ...abonneData,
                    montantPaye: montantInitial,
                    historiqueAbonnements: [newContract]
                });
                
                // 2. Ajouter le paiement initial à l'historique des paiements
                await db.collection('paiements').add({
                    abonne_id: docRef.id,
                    montant: montantInitial,
                    date: new Date(),
                    methode: 'Initial',
                    commentaire: `Abonnement initial du ${new Date(abonneData.dateDebut).toLocaleDateString()} au ${new Date(abonneData.dateFin).toLocaleDateString()}`
                });
                successMessage = "✅ Abonné ajouté avec succès.";
            }
            abonneModal.classList.remove('visible');
            showNotification(successMessage.replace('✅ ', ''), 'success');
        } catch (error) {
            console.error("Erreur d'écriture dans Firestore:", error);
            showNotification("Une erreur est survenue. Veuillez réessayer.", 'danger');
        }
    });

    // Écoute des changements dans la collection 'abonnes' en temps réel
    db.collection('abonnes').orderBy('nom').onSnapshot(snapshot => {
        allAbonnes = snapshot.docs;
        displayAbonnes(); // Initial render and re-render on data change
        // Attacher les événements aux nouveaux boutons
        // Utilisation de la délégation d'événements sur le conteneur de la liste
        attachAbonneActionListeners(abonnésList, abonneForm);
    });

    // Gérer l'ajout d'un nouveau paiement
    addPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const abonneId = paymentAbonneIdInput.value;
        const amount = parseFloat(document.getElementById('payment-amount').value);
        
        const newPayment = {
            montant: amount,
            date: new Date(),
            methode: "Paiement manuel",
            commentaire: document.getElementById('payment-comment').value,
        };

        if (!abonneId || isNaN(amount) || amount <= 0) {
            showNotification('Veuillez entrer un montant valide.', 'warning');
            return;
        }

        try {
            // Utiliser une transaction pour garantir l'intégrité des données
            await db.runTransaction(async (transaction) => {
                const abonneRef = db.collection('abonnes').doc(abonneId);
                const abonneDoc = await transaction.get(abonneRef);
                if (!abonneDoc.exists) {
                    throw "Abonné non trouvé!";
                }
                const abonneData = abonneDoc.data();
                
                const historique = abonneData.historiqueAbonnements || [];
                if (historique.length === 0) {
                    throw "Aucun contrat actif trouvé pour cet abonné.";
                }

                const currentContract = historique[historique.length - 1];
                const contractTotal = currentContract.montantTotal || 1500;
                const contractPaid = currentContract.montantPaye || 0;
                const resteAPayer = contractTotal - contractPaid;
                
                if (amount > resteAPayer) {
                    if (resteAPayer <= 0) {
                         throw `Ce contrat est déjà entièrement payé. Aucun paiement supplémentaire n'est nécessaire.`;
                    }
                    throw `Le paiement ne peut pas dépasser le montant restant dû de ${resteAPayer.toFixed(2)} DA.`;
                }

                // Mettre à jour le montant total payé
                const newMontantPaye = (abonneData.montantPaye || 0) + amount;
                
                // Mettre à jour le montant payé du contrat en cours dans l'historique
                currentContract.montantPaye = contractPaid + amount;

                transaction.update(abonneRef, { 
                    montantPaye: newMontantPaye,
                    historiqueAbonnements: historique 
                });

                // Ajouter le nouveau paiement
                const newPaymentRef = db.collection('paiements').doc();
                transaction.set(newPaymentRef, { ...newPayment, abonne_id: abonneId });
            });

            addPaymentForm.reset();
            showNotification(`Paiement de ${amount.toFixed(2)} DA ajouté avec succès.`, 'success');
        } catch (error) {
            console.error("Erreur lors de l'ajout du paiement: ", error);
            showNotification(String(error), 'danger');
        }
    });
}

/**
 * Attache les écouteurs d'événements pour les boutons d'action des abonnés.
 * Utilise la délégation d'événements pour être plus robuste.
 * @param {HTMLElement} container - L'élément parent qui contient les boutons.
 */
function attachAbonneActionListeners(container, abonneForm) {
    const abonneModal = document.getElementById('abonneModal');
    const paymentHistoryModal = document.getElementById('paymentHistoryModal');
    const paymentHistoryModalLabel = document.getElementById('paymentHistoryModalLabel');
    const contractsHistoryModal = document.getElementById('contractsHistoryModal');
    const contractsHistoryModalLabel = document.getElementById('contractsHistoryModalLabel');

    let unsubscribeFromPayments = null; // Pour stopper l'écouteur précédent
    let unsubscribeFromAbonneDoc = null;
    let unsubscribeFromPresences = null; // Keep for cleanup logic

    container.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const id = button.dataset.id;
        if (!id) return;

        // Clic sur le bouton "Supprimer"
        if (button.classList.contains('delete-btn')) {
            showConfirmation(
                'Confirmation de suppression',
                "Êtes-vous sûr de vouloir supprimer cet abonné ? Cette action est irréversible et supprimera tout son historique (contrats, paiements, ventes).",
                async () => {
                    try {
                        const batch = db.batch();

                        // 1. Supprimer les paiements associés
                        const paymentsSnapshot = await db.collection('paiements').where('abonne_id', '==', id).get();
                        paymentsSnapshot.forEach(doc => { batch.delete(doc.ref); });
                        
                        // 2. Supprimer les ventes associées
                        const ventesSnapshot = await db.collection('ventes').where('abonne_id', '==', id).get();
                        ventesSnapshot.forEach(doc => { batch.delete(doc.ref); });

                        // 3. Supprimer l'abonné lui-même
                        const abonneRef = db.collection('abonnes').doc(id);
                        batch.delete(abonneRef);

                        // Envoyer toutes les suppressions en une seule fois
                        await batch.commit();
                        showNotification("Abonné supprimé avec succès.", 'success');
                    } catch (error) {
                        console.error("Erreur lors de la suppression de l'abonné et de ses données:", error);
                        showNotification("Une erreur est survenue lors de la suppression.", 'danger');
                    }
                }
            );
        }

        // Clic sur le bouton "Modifier"
        else if (button.classList.contains('edit-btn')) {
            const docRef = db.collection('abonnes').doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists()) {
                const data = docSnap.data();
                const abonneModalLabel = document.getElementById('abonneModalLabel');
                abonneModalLabel.textContent = 'Modifier le Profil';
                abonneForm.reset();
                document.getElementById('abonne-id').value = id;
                document.getElementById('nom').value = data.nom;
                document.getElementById('nom').readOnly = false;
                
                // On ne modifie pas le paiement ici, mais on affiche ce qui a déjà été payé.
                // Le champ de paiement initial est désactivé lors de la modification.
                const montantInitialInput = document.getElementById('montant-initial');
                montantInitialInput.value = '';
                montantInitialInput.placeholder = `Paiements gérés dans l'historique`;
                montantInitialInput.disabled = true;

                document.getElementById('date-debut').value = data.dateDebut;
                document.getElementById('date-fin').value = data.dateFin;
                abonneModal.classList.add('visible');
            } else {
                 showNotification("Données de l'abonné introuvables.", 'warning');
            }
        }

        // Clic sur "Historique des contrats"
        else if (button.classList.contains('contracts-history-btn')) {
            const abonneNom = button.dataset.nom;
            contractsHistoryModalLabel.textContent = `Historique des Contrats de ${abonneNom}`;
            
            if (unsubscribeFromAbonneDoc) {
                unsubscribeFromAbonneDoc();
            }

            // On lit maintenant l'historique depuis le document de l'abonné
            unsubscribeFromAbonneDoc = db.collection('abonnes').doc(id)
                .onSnapshot(doc => {
                    const contractsHistoryList = document.getElementById('contracts-history-list');
                    contractsHistoryList.innerHTML = '';
                    const abonne = doc.data();
                    const historique = abonne.historiqueAbonnements || [];

                    if (!historique.length) {
                        contractsHistoryList.innerHTML = `<tr><td colspan="3" style="text-align:center;">Aucun contrat précédent.</td></tr>`;
                        return;
                    }

                    // On affiche du plus récent au plus ancien
                    historique.slice().reverse().forEach(contract => {
                        const contractTotal = contract.montantTotal || 0;
                        const contractPaid = contract.montantPaye || 0;
                        const isComplete = contractPaid >= contractTotal;

                        const statusBadge = isComplete 
                            ? `<span class="badge bg-success">Complet</span>`
                            : `<span class="badge bg-warning">Incomplet</span>`;
                        
                        const startDate = new Date(contract.dateDebut).toLocaleDateString();
                        const endDate = new Date(contract.dateFin).toLocaleDateString();

                        const tr = `
                            <tr>
                                <td data-label="Période">Du ${startDate} &rarr; Au ${endDate}</td>
                                <td data-label="Montant">${contractPaid.toFixed(2)} / ${contractTotal.toFixed(2)} DA</td>
                                <td data-label="Statut">${statusBadge}</td>
                            </tr>
                        `;
                        contractsHistoryList.innerHTML += tr;
                    });
                });
            
            contractsHistoryModal.classList.add('visible');
        }

        // Clic sur "Historique des paiements"
        else if (button.classList.contains('payment-history-btn')) {
            const abonneNom = button.dataset.nom;
            paymentHistoryModalLabel.textContent = `Ajouter un Paiement pour ${abonneNom}`;
            document.getElementById('payment-abonne-id').value = id;
            document.getElementById('add-payment-form').reset();
            paymentHistoryModal.classList.add('visible');
        }
        
        // Clic sur "Renouveler"
        else if (button.classList.contains('renew-btn')) {
            const abonneNom = button.dataset.nom;
            const abonneModalLabel = document.getElementById('abonneModalLabel');
            abonneModalLabel.textContent = `Renouveler l'Abonnement de ${abonneNom}`;

            abonneForm.reset();
            document.getElementById('abonne-id').value = id;
            document.getElementById('nom').value = abonneNom;
            document.getElementById('nom').readOnly = true; // Empêcher la modification du nom
            document.getElementById('montant-initial').disabled = false;
            document.getElementById('montant-initial').placeholder = "Montant du paiement";
            
            // Pré-remplir la date de début avec aujourd'hui et calculer la date de fin
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            const dateDebutInput = document.getElementById('date-debut');
            dateDebutInput.value = today.toISOString().split('T')[0];
            dateDebutInput.dispatchEvent(new Event('change')); // Déclenche le calcul de la date de fin

            abonneModal.classList.add('visible');
        }
    });

    // Fermer le modal d'historique des paiements
    paymentHistoryModal.addEventListener('click', (e) => {
        if (e.target.matches('[data-dismiss-modal]') || e.target.matches('.modal')) {
             if (unsubscribeFromPayments) {
                unsubscribeFromPayments();
                unsubscribeFromPayments = null;
            }
        }
    });

    // Fermer le modal d'historique des contrats
    contractsHistoryModal.addEventListener('click', (e) => {
        if (e.target.matches('[data-dismiss-modal]') || e.target.matches('.modal')) {
             if (unsubscribeFromAbonneDoc) {
                unsubscribeFromAbonneDoc();
                unsubscribeFromAbonneDoc = null;
            }
        }
    });

     // Gérer la suppression d'une présence (délégation d'événement)
    // This element is removed from HTML, so the listener can be removed to prevent errors.
}

// -----------------------------------------------------------------
// Gestion des Admins
// -----------------------------------------------------------------
function initAdmins() {
    const addAdminForm = document.getElementById('add-admin-form');
    const adminList = document.getElementById('admin-list');
    const addAdminFeedback = document.getElementById('add-admin-feedback');
    const addAdminBtn = document.getElementById('add-admin-btn');
    const addAdminSpinner = document.getElementById('add-admin-spinner');
    const addAdminBtnText = document.getElementById('add-admin-btn-text');

    addAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('new-admin-email');
        const passwordInput = document.getElementById('new-admin-password');
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        addAdminFeedback.classList.add('hidden');

        if (!email || !password) {
            showNotification("Veuillez remplir tous les champs.", 'warning');
            return;
        }

        // Show spinner and disable button
        addAdminSpinner.classList.remove('hidden');
        addAdminBtnText.classList.add('hidden');
        addAdminBtn.disabled = true;

        // Use a secondary Firebase app to create a user without logging out the current admin.
        const appName = `secondary-app-for-creation-${Date.now()}`;
        let secondaryApp;
        try {
            secondaryApp = firebase.initializeApp(firebaseConfig, appName);
            const secondaryAuth = secondaryApp.auth();

            // 1. Create the user in Firebase Auth
            await secondaryAuth.createUserWithEmailAndPassword(email, password);
            
            // The user is now created. We can sign them out of the secondary instance.
            await secondaryAuth.signOut();

            // 2. Add to Firestore 'admins' collection
            await db.collection('admins').add({
                email: email,
                addedBy: currentUser.email,
                role: "admin"
            });

            showNotification('Administrateur ajouté avec succès.', 'success');
            addAdminForm.reset();

        } catch (error) {
            console.error("Erreur lors de l'ajout de l'administrateur:", error);
            let errorMessage = "Une erreur est survenue.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Un compte avec cet email existe déjà.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
            }
            showNotification(errorMessage, 'danger');
        } finally {
            // Cleanup the secondary app instance
            if(secondaryApp) {
                await secondaryApp.delete();
            }
            
            // Hide spinner and re-enable button
            addAdminSpinner.classList.add('hidden');
            addAdminBtnText.classList.remove('hidden');
            addAdminBtn.disabled = false;
        }
    });

    // Afficher la liste des admins en temps réel
    db.collection('admins').onSnapshot(snapshot => {
        adminList.innerHTML = '';
        snapshot.forEach(doc => {
            const admin = doc.data();
            const isCurrentUser = admin.email === currentUser.email;
            
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '0.75rem 0';
            li.style.borderBottom = '1px solid var(--border-color)';

            const emailSpan = document.createElement('span');
            emailSpan.textContent = admin.email;
            li.appendChild(emailSpan);

            if (!isCurrentUser) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-sm btn-outline-danger';
                deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
                deleteButton.onclick = async () => {
                    if (confirm(`Êtes-vous sûr de vouloir retirer les droits d'administrateur pour ${admin.email} ?`)) {
                        await db.collection('admins').doc(doc.id).delete();
                    }
                };
                li.appendChild(deleteButton);
            } else {
                 const badge = document.createElement('span');
                 badge.className = 'badge bg-secondary';
                 badge.textContent = 'Vous';
                 li.appendChild(badge);
            }
            adminList.appendChild(li);
        });
        lucide.createIcons();
    });
}

// =================================================================
// Gestion des Produits et Ventes
// =================================================================

function initProduitsEtVentes() {
    const produitModal = document.getElementById('produitModal');
    const produitForm = document.getElementById('produit-form');
    const produitModalLabel = document.getElementById('produitModalLabel');
    const produitsList = document.getElementById('produits-list');

    const venteForm = document.getElementById('vente-form');
    const venteFeedback = document.getElementById('vente-feedback');
    const ventesList = document.getElementById('ventes-list');

    const venteProduitSelect = document.getElementById('vente-produit');
    const venteAbonneSelect = document.getElementById('vente-abonne');

    // Réinitialiser le modal d'ajout de produit
    document.getElementById('add-produit-btn').addEventListener('click', () => {
        produitModalLabel.textContent = 'Ajouter un Produit';
        produitForm.reset();
        document.getElementById('produit-id').value = '';
        produitModal.classList.add('visible');
    });

    // Gérer l'ajout/modification de produit
    produitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('produit-id').value;
        const produitData = {
            nom: document.getElementById('produit-nom').value,
            prix_unitaire: parseFloat(document.getElementById('produit-prix').value),
            stock: parseInt(document.getElementById('produit-stock').value),
            unite: document.getElementById('produit-unite').value,
        };

        try {
            if (id) {
                await db.collection('produits').doc(id).update(produitData);
            } else {
                await db.collection('produits').add(produitData);
            }
            produitModal.classList.remove('visible');
        } catch (error) {
            console.error("Erreur d'écriture dans Firestore (produits):", error);
            alert("Une erreur est survenue.");
        }
    });
    
    // Écouter les changements dans la collection 'produits'
    db.collection('produits').orderBy('nom').onSnapshot(snapshot => {
        produitsList.innerHTML = '';
        venteProduitSelect.innerHTML = '<option value="">Sélectionnez un produit...</option>';
        if (snapshot.empty) {
            produitsList.innerHTML = `<tr><td colspan="4" style="text-align:center;">Aucun produit pour le moment.</td></tr>`;
        }
        snapshot.forEach(doc => {
            const produit = doc.data();
            const inStock = produit.stock > 0;
            const rowClass = inStock ? '' : 'table-danger-row';

            // Afficher dans la table de gestion
            const tr = `
                <tr class="${rowClass}">
                    <td data-label="Nom">${produit.nom}</td>
                    <td data-label="Prix">${produit.prix_unitaire.toFixed(2)} € / ${produit.unite}</td>
                    <td data-label="Stock">${produit.stock}</td>
                    <td data-label="Actions" class="actions-cell">
                        <button class="btn btn-sm edit-produit-btn" data-id="${doc.id}"><i data-lucide="pencil"></i></button>
                        <button class="btn btn-sm delete-produit-btn" data-id="${doc.id}"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
            produitsList.innerHTML += tr;

            // Remplir le select pour les ventes (seulement si en stock)
            if (inStock) {
                const option = `<option value="${doc.id}" data-prix="${produit.prix_unitaire}" data-nom="${produit.nom}">${produit.nom} (${produit.stock} restants)</option>`;
                venteProduitSelect.innerHTML += option;
            }
        });
        lucide.createIcons();
        attachProduitActionListeners();
    });

    // Écouter les changements dans la collection 'abonnes' pour le sélecteur de vente
    db.collection('abonnes').orderBy('nom').onSnapshot(snapshot => {
        venteAbonneSelect.innerHTML = '<option value="">Aucun (vente au comptoir)</option>';
        snapshot.forEach(doc => {
            const abonne = doc.data();
            const option = `<option value="${doc.id}">${abonne.nom}</option>`;
            venteAbonneSelect.innerHTML += option;
        });
    });

    // Gérer l'enregistrement d'une vente
    venteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const produitOption = venteProduitSelect.options[venteProduitSelect.selectedIndex];
        if (!produitOption.value) {
            showFeedback(venteFeedback, 'Veuillez sélectionner un produit.', 'danger');
            return;
        }

        const produitId = produitOption.value;
        const produitNom = produitOption.dataset.nom;
        const produitPrix = parseFloat(produitOption.dataset.prix);
        const quantite = parseInt(document.getElementById('vente-quantite').value);
        const abonneId = document.getElementById('vente-abonne').value || null;
        
        const total = produitPrix * quantite;
        const produitRef = db.collection('produits').doc(produitId);

        try {
            await db.runTransaction(async (transaction) => {
                const produitDoc = await transaction.get(produitRef);
                if (!produitDoc.exists) throw "Produit non trouvé!";

                const currentStock = produitDoc.data().stock;
                if (currentStock < quantite) throw "Stock insuffisant!";

                // Mettre à jour le stock
                const newStock = currentStock - quantite;
                transaction.update(produitRef, { stock: newStock });

                // Créer l'enregistrement de la vente
                const venteRef = db.collection('ventes').doc();
                transaction.set(venteRef, {
                    produit_id: produitId,
                    nom_produit: produitNom,
                    quantite: quantite,
                    total: total,
                    abonne_id: abonneId,
                    nom_abonne: abonneId ? venteAbonneSelect.options[venteAbonneSelect.selectedIndex].text : null,
                    date_vente: new Date().toISOString()
                });
            });
            venteForm.reset();
            document.getElementById('vente-quantite').value = 1;
            showFeedback(venteFeedback, `Vente enregistrée avec succès pour un total de ${total.toFixed(2)} €`, 'success');

        } catch (error) {
            console.error("Erreur de transaction de vente:", error);
            showFeedback(venteFeedback, `Erreur: ${error}`, 'danger');
        }
    });

    // Écouter les changements dans la collection 'ventes' pour l'historique
    db.collection('ventes').orderBy('date_vente', 'desc').limit(20).onSnapshot(snapshot => {
        ventesList.innerHTML = '';
        if (snapshot.empty) {
            ventesList.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucune vente enregistrée récemment.</td></tr>`;
            return;
        }
        snapshot.forEach(doc => {
            const vente = doc.data();
            const tr = `
                <tr>
                    <td data-label="Date">${new Date(vente.date_vente).toLocaleString()}</td>
                    <td data-label="Produit">${vente.nom_produit}</td>
                    <td data-label="Qté">${vente.quantite}</td>
                    <td data-label="Total">${vente.total.toFixed(2)} €</td>
                    <td data-label="Abonné">${vente.nom_abonne || '<em>Comptoir</em>'}</td>
                    <td data-label="Actions" class="actions-cell">
                        <button class="btn btn-sm delete-vente-btn" data-id="${doc.id}" data-produit-id="${vente.produit_id}" data-quantite="${vente.quantite}" title="Annuler la vente et restaurer le stock">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                </tr>
            `;
            ventesList.innerHTML += tr;
        });
        lucide.createIcons();
    });

    // Utiliser la délégation d'événements pour gérer la suppression des ventes
    ventesList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-vente-btn');
        if (!deleteButton) return;

        const venteId = deleteButton.dataset.id;
        const produitId = deleteButton.dataset.produitId;
        const quantite = parseInt(deleteButton.dataset.quantite, 10);

        if (!venteId || !produitId || isNaN(quantite)) {
            showNotification("Données de vente invalides.", "danger");
            return;
        }

        showConfirmation(
            'Annuler la Vente',
            `Êtes-vous sûr de vouloir annuler cette vente ? Le stock du produit sera restauré (+${quantite}).`,
            async () => {
                const venteRef = db.collection('ventes').doc(venteId);
                const produitRef = db.collection('produits').doc(produitId);

                try {
                    await db.runTransaction(async (transaction) => {
                        const produitDoc = await transaction.get(produitRef);
                        if (!produitDoc.exists) {
                            // Si le produit n'existe plus, on supprime quand même la vente.
                            console.warn("Le produit associé à la vente n'existe plus, mais la vente sera supprimée.");
                        } else {
                            const newStock = (produitDoc.data().stock || 0) + quantite;
                            transaction.update(produitRef, { stock: newStock });
                        }
                        transaction.delete(venteRef);
                    });
                    showNotification("Vente annulée et stock restauré avec succès.", "success");
                } catch (error) {
                    console.error("Erreur lors de l'annulation de la vente: ", error);
                    showNotification("Une erreur est survenue. L'opération a été annulée.", "danger");
                }
            }
        );
    });
}

function attachProduitActionListeners() {
    const produitModal = document.getElementById('produitModal');

    // Clics sur "Supprimer"
    document.querySelectorAll('.delete-produit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm("⚠️ Confirmation requise\n\nÊtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.")) {
                await db.collection('produits').doc(id).delete();
            }
        });
    });

    // Clics sur "Modifier"
    document.querySelectorAll('.edit-produit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const docRef = db.collection('produits').doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('produitModalLabel').textContent = 'Modifier un Produit';
                document.getElementById('produit-id').value = id;
                document.getElementById('produit-nom').value = data.nom;
                document.getElementById('produit-prix').value = data.prix_unitaire;
                document.getElementById('produit-stock').value = data.stock;
                document.getElementById('produit-unite').value = data.unite;
                produitModal.classList.add('visible');
            }
        });
    });
}
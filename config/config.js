
require('dotenv').config();

const requiredEnvVars = [
    'PAYDUNYA_PUBLIC_KEY',
    'PAYDUNYA_TOKEN',
    'PAYDUNYA_MASTER_KEY',
    'PAYDUNYA_PRIVATE_KEY',
    'API_URL',
    'CALLBACK_URL',
    'PAYDUNYA_API_URL',
    'PORT',
];

// Vérification des variables d'environnement nécessaires
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Error: Missing environment variable ${varName}`);
        process.exit(1); // Arrêter l'application si une variable manque
    }
});

module.exports = {
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
    token: process.env.PAYDUNYA_TOKEN,
    masterKey: process.env.PAYDUNYA_MASTER_KEY,
    port: process.env.PORT || 3000, // Par défaut, le port est 3000
    apiUrl: process.env.API_URL,
    callbackUrl: process.env.CALLBACK_URL,
    paydunyaApiUrl: process.env.PAYDUNYA_API_URL,
};

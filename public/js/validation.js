document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const fullname = form.fullname?.value.trim();
    const phone = form.phone?.value.trim();
    const email = form.email?.value.trim();
    const password = form.password?.value;

    let errors = [];

    // Nom complet
    if (!fullname || fullname.length < 2) {
      errors.push("Le nom complet doit contenir au moins 2 caractères.");
    }

    // Téléphone simple validation
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      errors.push("Le numéro de téléphone est invalide.");
    }

    // Email simple validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push("L'adresse email est invalide.");
    }

    // Mot de passe critères
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      errors.push("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
    }

    if (errors.length > 0) {
      e.preventDefault();
      alert(errors.join('\n'));
    }
  });
});

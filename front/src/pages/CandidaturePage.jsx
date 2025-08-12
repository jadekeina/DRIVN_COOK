import React, { useState } from "react";

const CandidaturePage = () => {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    ville: "",
    zone: "",
    experience_resto: "",
    commentaire_resto: "",
    ancien_franchise: "",
    commentaire_franchise: "",
    capital: "",
    motivation: "",
    acceptTerms: false,
    readContract: false,
  });

  const [files, setFiles] = useState({
    cv: null,
    lettre: null,
    carte: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // Fonction pour formater le numéro de téléphone pendant la saisie
  const formatPhoneNumber = (value) => {
    // Supprimer tous les caractères non numériques, + et espaces
    let phone = value.replace(/[^0-9+\s]/g, "");

    // Si c'est un nouveau numéro qui commence par +33, le garder
    if (phone.startsWith("+33") && phone.length <= 12) {
      return phone;
    }

    // Sinon formater comme 06 12 34 56 78
    const cleaned = phone.replace(/[^0-9]/g, "");

    // Limiter à 10 chiffres pour numéro français
    const truncated = cleaned.slice(0, 10);

    // Formater avec des espaces
    let formatted = "";
    for (let i = 0; i < truncated.length; i++) {
      if (i % 2 === 0 && i > 0) formatted += " ";
      formatted += truncated[i];
    }

    return formatted;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "telephone") {
      // Appliquer le formatage pour le téléphone
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Créer un FormData pour envoyer les fichiers
      const formDataToSend = new FormData();

      // Ajouter tous les champs du formulaire
      Object.keys(formData).forEach((key) => {
        if (key === "acceptTerms" || key === "readContract") {
          formDataToSend.append(key, formData[key] ? "true" : "false");
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers
      if (files.cv) formDataToSend.append("cv", files.cv);
      if (files.lettre) formDataToSend.append("lettre", files.lettre);
      if (files.carte) formDataToSend.append("carte", files.carte);

      // Envoyer la requête
      const response = await fetch("http://localhost:3002/api/candidatures", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(
          "Candidature envoyée avec succès ! Nous vous recontacterons sous 48-72h.",
        );
        // Réinitialiser le formulaire
        setFormData({
          prenom: "",
          nom: "",
          email: "",
          telephone: "",
          ville: "",
          zone: "",
          experience_resto: "",
          commentaire_resto: "",
          ancien_franchise: "",
          commentaire_franchise: "",
          capital: "",
          motivation: "",
          acceptTerms: false,
          readContract: false,
        });
        setFiles({ cv: null, lettre: null, carte: null });

        // Réinitialiser les inputs file
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => (input.value = ""));
      } else {
        setSubmitMessage(`Erreur: ${result.message}`);
        if (result.errors) {
          const errorMessages = result.errors.map((err) => err.msg).join(", ");
          setSubmitMessage(`Erreur: ${result.message} - ${errorMessages}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setSubmitMessage(
        "Erreur lors de l'envoi de la candidature. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Devenir Franchisé
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rejoignez notre réseau et développez votre propre franchise Driv'n
            Cook. Remplissez ce formulaire pour candidater.
          </p>
        </div>

        {/* Message de soumission */}
        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              submitMessage.includes("succès")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {submitMessage}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Section 1: Informations Générales */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Informations générales
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    name="prenom"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Votre prénom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    name="nom"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Votre nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    name="telephone"
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="06 12 34 56 78"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Numéro à 10 chiffres (sera formaté automatiquement)
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Documents */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                  2
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Documents requis *
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "cv", label: "CV (PDF)", accept: ".pdf" },
                  {
                    name: "lettre",
                    label: "Lettre de motivation (PDF)",
                    accept: ".pdf",
                  },
                  {
                    name: "carte",
                    label: "Carte d'identité",
                    accept: ".pdf,.jpg,.jpeg,.png",
                  },
                ].map((doc) => (
                  <div key={doc.name} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {doc.label}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name={doc.name}
                        accept={doc.accept}
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                      {files[doc.name] && (
                        <p className="mt-1 text-sm text-green-600">
                          ✓ {files[doc.name].name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Candidature */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                  3
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Votre projet
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville ou département souhaité *
                  </label>
                  <input
                    name="ville"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Paris, Lyon, Marseille..."
                    value={formData.ville}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone préférée *
                  </label>
                  <select
                    name="zone"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={formData.zone}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionnez une zone</option>
                    <option value="urbaine">Centre urbain</option>
                    <option value="peripherie">Périphérie</option>
                    <option value="evenementiel">Évènementiel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expérience en restauration *
                  </label>
                  <select
                    name="experience_resto"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white mb-3"
                    value={formData.experience_resto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Avez-vous de l'expérience ?</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                  <textarea
                    name="commentaire_resto"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Décrivez votre expérience en restauration..."
                    rows={3}
                    value={formData.commentaire_resto}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expérience entrepreneuriale *
                  </label>
                  <select
                    name="ancien_franchise"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white mb-3"
                    value={formData.ancien_franchise}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Déjà franchisé ou entrepreneur ?</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                  <textarea
                    name="commentaire_franchise"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Détaillez votre parcours entrepreneurial..."
                    rows={3}
                    value={formData.commentaire_franchise}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital disponible *
                </label>
                <select
                  name="capital"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={formData.capital}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Disposez-vous d'un capital de 50 000€ ?
                  </option>
                  <option value="oui">Oui, je dispose du capital requis</option>
                  <option value="non">Non, j'ai besoin d'un financement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre motivation *
                </label>
                <textarea
                  name="motivation"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Expliquez-nous pourquoi vous souhaitez rejoindre Driv'n Cook et ce qui vous motive dans ce projet... (minimum 50 caractères)"
                  value={formData.motivation}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.motivation.length}/2000 caractères
                </p>
              </div>
            </div>

            {/* Section 4: Validation */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      J'accepte que mes données personnelles soient utilisées
                      pour le traitement de ma candidature conformément à la
                      politique de confidentialité. *
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="readContract"
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.readContract}
                      onChange={handleChange}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      J'ai lu et accepté les{" "}
                      <a
                        href="/contrat-franchise.pdf"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        conditions du contrat de franchise
                      </a>{" "}
                      *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-0.5"
                } text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Nous reviendrons vers vous sous 48-72h maximum.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                * Champs obligatoires
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Progression du formulaire</span>
                <span>3/3 sections</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Réponse rapide</h3>
            <p className="text-sm text-gray-600">
              Nous étudions votre candidature et revenons vers vous sous 48-72h
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Accompagnement</h3>
            <p className="text-sm text-gray-600">
              Formation complète et suivi personnalisé pour votre réussite
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Croissance</h3>
            <p className="text-sm text-gray-600">
              Rejoignez un réseau en pleine expansion avec un concept innovant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidaturePage;

// services/emailService.js - CORRIGÉ
const nodemailer = require("nodemailer");

// Configuration du transporteur email
const createTransport = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const emailService = {
  // Méthode générique pour envoyer un email
  sendEmail: async (to, subject, text, html) => {
    try {
      const transporter = createTransport();

      const mailOptions = {
        from: process.env.MAIL_USER,
        to,
        subject,
        text,
        html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw error;
    }
  },

  // Email d'acceptation avec lien vers contrat React
  sendAcceptanceEmail: async (candidature, activationToken) => {
    try {
      const transporter = createTransport();

      // URL vers le contrat React
      const contractUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${activationToken}`;

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: candidature.email,
        subject: "Félicitations ! Votre candidature Driv'n Cook a été acceptée",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
              <h1>Candidature Acceptée !</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2>Bonjour ${candidature.prenom} ${candidature.nom},</h2>
              
              <p>Excellente nouvelle ! Nous avons le plaisir de vous informer que votre candidature pour rejoindre le réseau <strong>Driv'n Cook</strong> a été acceptée !</p>
              
              <div style="background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3>Récapitulatif de votre candidature :</h3>
                <ul>
                  <li><strong>Zone souhaitée :</strong> ${candidature.zone}</li>
                  <li><strong>Ville :</strong> ${candidature.ville}</li>
                  <li><strong>Email :</strong> ${candidature.email}</li>
                  <li><strong>Téléphone :</strong> ${candidature.telephone}</li>
                </ul>
              </div>
              
              <div style="background-color: #007bff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h3 style="color: white; margin-top: 0;">Prochaines étapes</h3>
                <p style="color: white; margin-bottom: 20px;">Cliquez sur le bouton ci-dessous pour :</p>
                <ol style="color: white; text-align: left; margin: 15px 0;">
                  <li><strong>Consulter et signer</strong> votre contrat de franchise</li>
                  <li><strong>Effectuer le paiement</strong> du droit d'entrée (50 000€)</li>
                  <li><strong>Créer votre compte</strong> franchisé</li>
                </ol>
                <a href="${contractUrl}" 
                   style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin-top: 15px;">
                  CONSULTER MON CONTRAT
                </a>
                <p style="color: #e3f2fd; font-size: 12px; margin-top: 15px;">
                  Ce lien est valide pendant 48h
                </p>
              </div>
              
              <p>Nous sommes ravis de vous accueillir dans la famille Driv'n Cook !</p>
              
              <p>Cordialement,<br>
              <strong>L'équipe Driv'n Cook</strong></p>
            </div>
            
            <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
              © 2024 Driv'n Cook - Tous droits réservés
            </div>
          </div>
        `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email d'acceptation envoyé:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Erreur envoi email acceptation:", error);
      throw error;
    }
  },

  // Email de confirmation de compte créé
  sendAccountCreatedEmail: async (userData) => {
    try {
      const transporter = createTransport();

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: userData.email,
        subject: "Compte créé - Bienvenue chez Driv'n Cook",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
              <h1>Compte créé avec succès !</h1>
              <p>Bienvenue dans la famille Driv'n Cook</p>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2>Bonjour ${userData.first_name} ${userData.last_name},</h2>
              
              <p>Votre compte franchisé est maintenant actif.</p>
              
              <p>Cordialement,<br>
              <strong>L'équipe Driv'n Cook</strong></p>
            </div>
          </div>
        `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email de compte créé envoyé:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Erreur envoi email compte créé:", error);
      throw error;
    }
  },

  // Email de refus
  sendRejectionEmail: async (candidature) => {
    try {
      const transporter = createTransport();

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: candidature.email,
        subject: "Réponse à votre candidature Driv'n Cook",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #6c757d; color: white; padding: 20px; text-align: center;">
              <h1>Réponse à votre candidature</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2>Bonjour ${candidature.prenom} ${candidature.nom},</h2>
              
              <p>Nous vous remercions sincèrement pour l'intérêt que vous portez au réseau <strong>Driv'n Cook</strong>.</p>
              
              <p>Après étude attentive de votre dossier, nous regrettons de vous informer que nous ne pouvons pas donner suite favorable à votre candidature pour le moment.</p>
              
              <p>Cordialement,<br>
              <strong>L'équipe Driv'n Cook</strong></p>
            </div>
          </div>
        `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email de refus envoyé:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Erreur envoi email refus:", error);
      throw error;
    }
  },

  // Email d'attribution de franchise
  sendFranchiseAssignmentEmail: async (data) => {
    const { email, prenom, nom, franchise_nom, franchise_ville } = data;

    const subject = `Franchise attribuée - ${franchise_nom}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Franchise Attribuée</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>Franchise Attribuée !</h1>
          <p>Félicitations ${prenom}, votre franchise vous attend</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
          
          <p>Nous avons le plaisir de vous informer qu'une franchise Driv'n Cook vous a été attribuée !</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5C95FF;">
            <h3>Votre Franchise</h3>
            <p><strong>Nom :</strong> ${franchise_nom}</p>
            <p><strong>Ville :</strong> ${franchise_ville}</p>
            <p><strong>Date d'attribution :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p>Bienvenue officiellement dans le réseau Driv'n Cook !</p>
          
          <p>Cordialement,<br>
          L'équipe Driv'n Cook</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Franchise Attribuée - ${franchise_nom}
      
      Bonjour ${prenom} ${nom},
      
      Une franchise Driv'n Cook vous a été attribuée !
      
      Votre Franchise :
      - Nom : ${franchise_nom}
      - Ville : ${franchise_ville}
      - Date d'attribution : ${new Date().toLocaleDateString('fr-FR')}
      
      Bienvenue dans le réseau Driv'n Cook !
    `;

    return emailService.sendEmail(email, subject, text, html);
  },

  // Email de désattribution de franchise
  sendFranchiseUnassignmentEmail: async (data) => {
    const { email, prenom, nom, franchise_nom, franchise_ville } = data;

    const subject = `Modification de votre franchise - ${franchise_nom}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Modification Franchise</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; color: #333; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 3px solid #6c757d;">
          <h1>Modification de votre franchise</h1>
          <p>Information importante concernant ${prenom}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
          
          <p>Une modification a été apportée à votre attribution de franchise.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3>Franchise concernée</h3>
            <p><strong>Nom :</strong> ${franchise_nom}</p>
            <p><strong>Ville :</strong> ${franchise_ville}</p>
            <p><strong>Date de modification :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p>Cette franchise n'est plus attribuée à votre compte.</p>
          
          <p>Merci pour votre compréhension.</p>
          
          <p>Cordialement,<br>
          L'équipe Driv'n Cook</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Modification de votre franchise - ${franchise_nom}
      
      Bonjour ${prenom} ${nom},
      
      Une modification a été apportée à votre attribution de franchise.
      
      Franchise concernée :
      - Nom : ${franchise_nom}  
      - Ville : ${franchise_ville}
      
      Cette franchise n'est plus attribuée à votre compte.
      
      Cordialement,
      L'équipe Driv'n Cook
    `;

    return emailService.sendEmail(email, subject, text, html);
  },

  // Ajoutez ces méthodes à la fin de votre emailService dans email.Service.js :

// Méthode de test simple
  sendTestEmail: async (destinataire) => {
    try {
      console.log('[EMAIL TEST] Envoi email de test vers:', destinataire);
      const transporter = createTransport();
      const result = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: destinataire,
        subject: 'Test Driv\'n Cook',
        html: '<h1>Test email Driv\'n Cook</h1><p>Si vous recevez cet email, la configuration fonctionne !</p>'
      });

      console.log('[EMAIL TEST] Test email envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[EMAIL TEST] Erreur test email:', error);
      throw error;
    }
  },

// Test de configuration amélioré
  testConnection: async () => {
    try {
      console.log('[EMAIL] Test de connexion...');
      console.log('[EMAIL] MAIL_USER:', process.env.MAIL_USER ? 'Configuré' : 'NON CONFIGURÉ');
      console.log('[EMAIL] MAIL_PASS:', process.env.MAIL_PASS ? 'Configuré' : 'NON CONFIGURÉ');

      const transporter = createTransport();
      await transporter.verify();
      console.log("[EMAIL] ✅ Connexion email OK");
      return true;
    } catch (error) {
      console.error("[EMAIL] ❌ Erreur connexion email:");
      console.error("Message:", error.message);
      console.error("Code:", error.code);
      return false;
    }
  },

  // Test de connexion email
  testConnection: async () => {
    try {
      const transporter = createTransport();
      await transporter.verify();
      console.log("Connexion email OK");
      return true;
    } catch (error) {
      console.error("Erreur connexion email:", error);
      return false;
    }
  }
};



module.exports = emailService;
// services/emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransport = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER, // Ton email Gmail
            pass: process.env.MAIL_PASS  // Mot de passe d'application Gmail
        }
    });
};

const emailService = {
    // Envoyer un email d'acceptation de candidature
    sendAcceptanceEmail: async (candidature, activationToken) => {
        try {
            const transporter = createTransport(); // CORRIGÉ ICI

            // URL de création de compte (tu changeras ça plus tard pour ton vrai domaine)
            const activationUrl = `http://localhost:3000/activation/${activationToken}`;

            const mailOptions = {
                from: process.env.MAIL_USER,
                to: candidature.email,
                subject: '🎉 Félicitations ! Votre candidature Driv\'n Cook a été acceptée',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                        <h1>🎉 Candidature Acceptée !</h1>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2>Bonjour ${candidature.prenom} ${candidature.nom},</h2>
                        
                        <p>Excellente nouvelle ! Nous avons le plaisir de vous informer que votre candidature pour rejoindre le réseau <strong>Driv'n Cook</strong> a été acceptée !</p>
                        
                        <div style="background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <h3>📋 Récapitulatif de votre candidature :</h3>
                            <ul>
                                <li><strong>Zone souhaitée :</strong> ${candidature.zone}</li>
                                <li><strong>Ville :</strong> ${candidature.ville}</li>
                                <li><strong>Email :</strong> ${candidature.email}</li>
                                <li><strong>Téléphone :</strong> ${candidature.telephone}</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #007bff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                            <h3 style="color: white; margin-top: 0;">🔐 Activez votre compte franchisé</h3>
                            <p style="color: white; margin-bottom: 20px;">Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace franchisé :</p>
                            <a href="${activationUrl}" 
                               style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                ✨ CRÉER MON COMPTE
                            </a>
                            <p style="color: #e3f2fd; font-size: 12px; margin-top: 15px;">
                                Ce lien est valide pendant 48h
                            </p>
                        </div>
                        
                        <h3>🚀 Prochaines étapes :</h3>
                        <ol>
                            <li><strong>Activez votre compte</strong> avec le lien ci-dessus</li>
                            <li>Accédez à votre espace franchisé personnel</li>
                            <li>Un membre de notre équipe vous contactera dans les 48h</li>
                            <li>Vous recevrez votre pack franchisé avec tous les documents</li>
                        </ol>
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <p><strong>⚠️ Important :</strong></p>
                            <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
                            <p style="word-break: break-all; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 3px;">
                                ${activationUrl}
                            </p>
                        </div>
                        
                        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>💡 Besoin d'aide ?</strong></p>
                            <p>N'hésitez pas à nous contacter :</p>
                            <p>📧 Email : contact@drivncook.com<br>
                            📞 Téléphone : 01 23 45 67 89</p>
                        </div>
                        
                        <p>Nous sommes ravis de vous accueillir dans la famille Driv'n Cook !</p>
                        
                        <p>Cordialement,<br>
                        <strong>L'équipe Driv'n Cook</strong></p>
                    </div>
                    
                    <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                        © 2024 Driv'n Cook - Tous droits réservés
                    </div>
                </div>
            `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email d\'acceptation envoyé:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('Erreur envoi email acceptation:', error);
            throw error;
        }
    },

    // Envoyer un email de refus de candidature
    sendRejectionEmail: async (candidature) => {
        try {
            const transporter = createTransport();

            const mailOptions = {
                from: process.env.MAIL_USER,
                to: candidature.email,
                subject: 'Réponse à votre candidature Driv\'n Cook',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #6c757d; color: white; padding: 20px; text-align: center;">
                            <h1>Réponse à votre candidature</h1>
                        </div>
                        
                        <div style="padding: 20px; background-color: #f9f9f9;">
                            <h2>Bonjour ${candidature.prenom} ${candidature.nom},</h2>
                            
                            <p>Nous vous remercions sincèrement pour l'intérêt que vous portez au réseau <strong>Driv'n Cook</strong> et pour le temps que vous avez consacré à votre candidature.</p>
                            
                            <p>Après étude attentive de votre dossier, nous regrettons de vous informer que nous ne pouvons pas donner suite favorable à votre candidature pour le moment.</p>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                                <p><strong>💡 Cette décision ne remet pas en question vos qualités</strong></p>
                                <p>Nous recevons de nombreuses candidatures et devons faire des choix difficiles en fonction de nos critères spécifiques et de nos besoins actuels.</p>
                            </div>
                            
                            <h3>🔄 Pour l'avenir :</h3>
                            <ul>
                                <li>Votre candidature reste dans notre base de données</li>
                                <li>Nous pourrons vous recontacter si de nouvelles opportunités se présentent</li>
                                <li>N'hésitez pas à repostuler dans 6 mois si votre situation évolue</li>
                            </ul>
                            
                            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>📞 Restons en contact :</strong></p>
                                <p>📧 Email : contact@drivncook.com<br>
                                📞 Téléphone : 01 23 45 67 89</p>
                            </div>
                            
                            <p>Nous vous souhaitons plein succès dans vos projets futurs.</p>
                            
                            <p>Cordialement,<br>
                            <strong>L'équipe Driv'n Cook</strong></p>
                        </div>
                        
                        <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                            © 2024 Driv'n Cook - Tous droits réservés
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email de refus envoyé:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('Erreur envoi email refus:', error);
            throw error;
        }
    },

    // Test de connexion email
    testConnection: async () => {
        try {
            const transporter = createTransport();
            await transporter.verify();
            console.log('✅ Connexion email OK');
            return true;
        } catch (error) {
            console.error('❌ Erreur connexion email:', error);
            return false;
        }
    }
};

module.exports = emailService;
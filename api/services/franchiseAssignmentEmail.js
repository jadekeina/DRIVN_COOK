// services/franchiseAssignmentEmail.js
const nodemailer = require('nodemailer');

class FranchiseAssignmentEmailService {
    constructor() {
        // Configuration du transporteur email (à adapter selon votre service)
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    // Template HTML pour l'email d'assignation
    getAssignmentEmailTemplate(userData, franchiseData) {
        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignation de votre franchise Driv'n Cook</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .franchise-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5C95FF; }
            .highlight { color: #5C95FF; font-weight: bold; }
            .next-steps { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .btn { background: #5C95FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Félicitations ${userData.first_name} !</h1>
                <p>Votre franchise Driv'n Cook vous a été assignée</p>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${userData.first_name} ${userData.last_name}</strong>,</p>
                
                <p>Nous avons le plaisir de vous informer que votre franchise <span class="highlight">Driv'n Cook</span> vous a été officiellement assignée !</p>
                
                <div class="franchise-card">
                    <h3>Détails de votre franchise</h3>
                    <p><strong>Nom :</strong> ${franchiseData.name}</p>
                    <p><strong>Ville :</strong> ${franchiseData.city}</p>
                    <p><strong>Adresse :</strong> ${franchiseData.address || 'À définir'}</p>
                    <p><strong>Zone assignée :</strong> ${userData.assigned_zone}</p>
                    <p><strong>Date d'assignation :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div class="next-steps">
                    <h3> Prochaines étapes</h3>
                    <ol>
                        <li>Connectez-vous à votre espace franchisé pour accéder à tous vos outils</li>
                        <li>Consultez votre guide de démarrage dans la section "Documentation"</li>
                        <li>Planifiez votre premier rendez-vous avec votre conseiller dédié</li>
                        <li>Commencez à configurer votre zone d'activité</li>
                    </ol>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">
                        Accéder à mon espace franchisé
                    </a>
                </div>
                
                <p><strong>Informations importantes :</strong></p>
                <ul>
                    <li>Votre statut a été mis à jour vers "Franchise Active"</li>
                    <li>Vous avez maintenant accès à tous les outils franchisé</li>
                    <li>Un conseiller vous contactera sous 48h pour vous accompagner</li>
                </ul>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:support@drivncook.fr">support@drivncook.fr</a> ou au 01 23 45 67 89.</p>
                
                <p>Bienvenue dans la famille Driv'n Cook !</p>
                
                <p>
                    Cordialement,<br>
                    <strong>L'équipe Driv'n Cook</strong>
                </p>
            </div>
            
            <div class="footer">
                <p>Driv'n Cook - Cuisine mobile de qualité</p>
                <p>Cet email a été envoyé automatiquement suite à l'assignation de votre franchise</p>
            </div>
        </div>
    </body>
    </html>
    `;
    }

    // Envoyer l'email d'assignation
    async sendAssignmentEmail(userData, franchiseData) {
        try {
            console.log(`[EMAIL] Envoi email assignation à ${userData.email}`);

            const mailOptions = {
                from: {
                    name: 'Driv\'n Cook',
                    address: process.env.SMTP_FROM || 'noreply@drivncook.fr'
                },
                to: userData.email,
                subject: `🎉 Votre franchise ${franchiseData.name} vous a été assignée !`,
                html: this.getAssignmentEmailTemplate(userData, franchiseData),
                text: this.getPlainTextVersion(userData, franchiseData)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Email assignation envoyé avec succès à ${userData.email}:`, result.messageId);

            return {
                success: true,
                messageId: result.messageId,
                recipient: userData.email
            };

        } catch (error) {
            console.error(`[EMAIL] Erreur envoi email assignation à ${userData.email}:`, error);

            return {
                success: false,
                error: error.message,
                recipient: userData.email
            };
        }
    }

    // Version texte simple de l'email
    getPlainTextVersion(userData, franchiseData) {
        return `
Félicitations ${userData.first_name} !

Votre franchise Driv'n Cook vous a été assignée.

Détails de votre franchise :
- Nom : ${franchiseData.name}
- Ville : ${franchiseData.city}
- Zone assignée : ${userData.assigned_zone}
- Date d'assignation : ${new Date().toLocaleDateString('fr-FR')}

Prochaines étapes :
1. Connectez-vous à votre espace franchisé
2. Consultez votre guide de démarrage
3. Planifiez votre premier rendez-vous avec votre conseiller
4. Configurez votre zone d'activité

Connectez-vous : ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Pour toute question : support@drivncook.fr ou 01 23 45 67 89

Bienvenue dans la famille Driv'n Cook !

L'équipe Driv'n Cook
    `;
    }

    // Envoyer un email de notification à l'admin
    async sendAdminNotification(userData, franchiseData, adminEmail = 'admin@drivncook.fr') {
        try {
            const mailOptions = {
                from: {
                    name: 'Système Driv\'n Cook',
                    address: process.env.SMTP_FROM || 'system@drivncook.fr'
                },
                to: adminEmail,
                subject: `[ADMIN] Nouvelle assignation de franchise - ${franchiseData.name}`,
                html: `
        <h2>Nouvelle assignation de franchise</h2>
        <p><strong>Franchise :</strong> ${franchiseData.name} (${franchiseData.city})</p>
        <p><strong>Assignée à :</strong> ${userData.first_name} ${userData.last_name} (${userData.email})</p>
        <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p><strong>Zone :</strong> ${userData.assigned_zone}</p>
        
        <p>L'email de confirmation a été envoyé automatiquement à l'utilisateur.</p>
        `,
                text: `
Nouvelle assignation de franchise

Franchise : ${franchiseData.name} (${franchiseData.city})
Assignée à : ${userData.first_name} ${userData.last_name} (${userData.email})
Date : ${new Date().toLocaleString('fr-FR')}
Zone : ${userData.assigned_zone}

L'email de confirmation a été envoyé automatiquement à l'utilisateur.
        `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Notification admin envoyée pour l'assignation de ${franchiseData.name}`);

        } catch (error) {
            console.error(`[EMAIL] Erreur envoi notification admin:`, error);
        }
    }
}

module.exports = new FranchiseAssignmentEmailService();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("Email not sent: SMTP_USER or SMTP_PASSWORD not configured.");
    return false;
  }

  if (!payload.to) {
    console.warn("Email not sent: missing recipient.");
    return false;
  }

  await transporter.sendMail({
    from: `"PermisAccéléré" <${process.env.SMTP_USER}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return true;
}

export function buildConfirmationEmail(
  userName: string,
  stageTitle: string,
  autoEcoleName: string,
  startDate: string,
  endDate: string,
  totalPrice: number
): { subject: string; html: string } {
  const formattedStart = new Date(startDate).toLocaleDateString("fr-FR");
  const formattedEnd = new Date(endDate).toLocaleDateString("fr-FR");

  return {
    subject: "Confirmation de votre réservation - PermisAccéléré",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 32px 0; border-bottom: 2px solid #3647AC;">
          <h1 style="color: #3647AC; margin: 0;">PermisAccéléré</h1>
          <p style="color: #666; margin: 8px 0 0;">Confirmation de réservation</p>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${userName},</p>
          <p>Votre réservation a bien été confirmée. Voici les détails de votre stage :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Stage</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${stageTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Auto-école</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${autoEcoleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Période</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Du ${formattedStart} au ${formattedEnd}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666;">Total payé</td>
              <td style="padding: 8px; font-weight: 600; color: #3647AC;">${totalPrice.toLocaleString("fr-FR")} €</td>
            </tr>
          </table>
          <p style="margin-top: 24px;">Vous recevrez votre reçu par email sous peu.</p>
          <p>Merci de votre confiance !</p>
        </div>
        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
          PermisAccéléré - Tous droits réservés
        </div>
      </div>
    `,
  };
}

export function buildReceiptEmail(
  userName: string,
  bookingId: string,
  stageTitle: string,
  autoEcoleName: string,
  autoEcoleCity: string,
  autoEcolePhone: string,
  autoEcoleEmail: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  createdAt: string
): { subject: string; html: string } {
  const formattedStart = new Date(startDate).toLocaleDateString("fr-FR");
  const formattedEnd = new Date(endDate).toLocaleDateString("fr-FR");
  const formattedCreated = new Date(createdAt).toLocaleDateString("fr-FR");

  return {
    subject: "Reçu de votre réservation - PermisAccéléré",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 32px 0; border-bottom: 2px solid #3647AC;">
          <h1 style="color: #3647AC; margin: 0;">PermisAccéléré</h1>
          <p style="color: #666; margin: 8px 0 0;">Reçu de réservation</p>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${userName},</p>
          <p>Voici le reçu de votre réservation :</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h2 style="font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em;">Détails de la réservation</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">N° réservation</span>
              <span style="font-weight: 600;">${bookingId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Date de réservation</span>
              <span style="font-weight: 600;">${formattedCreated}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Statut</span>
              <span style="font-weight: 600;">Confirmée</span>
            </div>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h2 style="font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em;">Stage</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Titre</span>
              <span style="font-weight: 600;">${stageTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Période</span>
              <span style="font-weight: 600;">Du ${formattedStart} au ${formattedEnd}</span>
            </div>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h2 style="font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em;">Auto-école</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Nom</span>
              <span style="font-weight: 600;">${autoEcoleName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Ville</span>
              <span style="font-weight: 600;">${autoEcoleCity}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Téléphone</span>
              <span style="font-weight: 600;">${autoEcolePhone}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Email</span>
              <span style="font-weight: 600;">${autoEcoleEmail}</span>
            </div>
          </div>
          <div style="background: #f3f4f6; padding: 16px 20px; border-radius: 12px; margin-top: 24px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">Total payé</span>
              <span style="font-size: 20px; color: #3647AC; font-weight: 700;">${totalPrice.toLocaleString("fr-FR")} €</span>
            </div>
          </div>
          <p style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px;">PermisAccéléré - Ce reçu est généré automatiquement et fait foi de réservation.</p>
        </div>
      </div>
    `,
  };
}

export function buildAutoEcoleNotificationEmail(
  autoEcoleName: string,
  studentName: string,
  studentEmail: string,
  studentPhone: string | null,
  stageTitle: string,
  startDate: string,
  endDate: string,
  totalPrice: number
): { subject: string; html: string } {
  const formattedStart = new Date(startDate).toLocaleDateString("fr-FR");
  const formattedEnd = new Date(endDate).toLocaleDateString("fr-FR");

  return {
    subject: "Nouvelle réservation sur votre stage - PermisAccéléré",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 32px 0; border-bottom: 2px solid #3647AC;">
          <h1 style="color: #3647AC; margin: 0;">PermisAccéléré</h1>
          <p style="color: #666; margin: 8px 0 0;">Nouvelle réservation</p>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${autoEcoleName},</p>
          <p>Un élève vient de réserver votre stage. Voici les détails :</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h2 style="font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em;">Élève</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Nom</span>
              <span style="font-weight: 600;">${studentName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Email</span>
              <span style="font-weight: 600;">${studentEmail}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Téléphone</span>
              <span style="font-weight: 600;">${studentPhone || "Non renseigné"}</span>
            </div>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h2 style="font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em;">Stage</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Titre</span>
              <span style="font-weight: 600;">${stageTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Période</span>
              <span style="font-weight: 600;">Du ${formattedStart} au ${formattedEnd}</span>
            </div>
          </div>
          <div style="background: #f3f4f6; padding: 16px 20px; border-radius: 12px; margin-top: 24px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">Total payé</span>
              <span style="font-size: 20px; color: #3647AC; font-weight: 700;">${totalPrice.toLocaleString("fr-FR")} €</span>
            </div>
          </div>
          <p style="margin-top: 24px;">Cette réservation est automatiquement confirmée. Vous pouvez la consulter dans votre tableau de bord PermisAccéléré.</p>
        </div>
        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
          PermisAccéléré - Tous droits réservés
        </div>
      </div>
    `,
  };
}

export function buildCancellationEmail(options: {
  recipientName: string;
  cancelledBy: "student" | "auto_ecole";
  stageTitle: string;
  autoEcoleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  wasPaid: boolean;
  refunded: boolean;
}): { subject: string; html: string } {
  const formattedStart = new Date(options.startDate).toLocaleDateString("fr-FR");
  const formattedEnd = new Date(options.endDate).toLocaleDateString("fr-FR");
  const byWhom =
    options.cancelledBy === "auto_ecole" ? "par l'auto-école" : "par l'élève";
  const refundLine = !options.wasPaid
    ? ""
    : options.refunded
      ? `<p>Le montant payé (${options.totalPrice.toLocaleString("fr-FR")} €) est remboursé sur le moyen de paiement utilisé. Il apparaîtra sur le relevé sous quelques jours ouvrés.</p>`
      : `<p>Le remboursement du montant payé (${options.totalPrice.toLocaleString("fr-FR")} €) est en cours de traitement. Notre équipe reviendra vers vous rapidement.</p>`;

  return {
    subject: "Annulation de réservation - PermisAccéléré",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 32px 0; border-bottom: 2px solid #3647AC;">
          <h1 style="color: #3647AC; margin: 0;">PermisAccéléré</h1>
          <p style="color: #666; margin: 8px 0 0;">Annulation de réservation</p>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${options.recipientName},</p>
          <p>La réservation suivante a été annulée ${byWhom} :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Stage</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${options.stageTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Auto-école</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${options.autoEcoleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666;">Période</td>
              <td style="padding: 8px; font-weight: 600;">Du ${formattedStart} au ${formattedEnd}</td>
            </tr>
          </table>
          ${refundLine}
          <p>Pour toute question, répondez simplement à cet email.</p>
        </div>
        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
          PermisAccéléré - Tous droits réservés
        </div>
      </div>
    `,
  };
}

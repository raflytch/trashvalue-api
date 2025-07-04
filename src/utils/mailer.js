import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, "..", "templates", templateName);
  return fs.readFileSync(templatePath, "utf-8");
};

const replaceTemplateVariables = (template, variables) => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }

  result = result.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
    (match, condition, content) => {
      return variables[condition] ? content : "";
    }
  );

  return result;
};

export const sendDropoffStatusUpdateEmail = async (userEmail, dropoffData) => {
  try {
    const template = loadTemplate("dropoff-status-update.html");

    const statusClass = dropoffData.status.toLowerCase();
    const isCompleted = dropoffData.status === "COMPLETED";
    const isRejected = dropoffData.status === "REJECTED";

    const balanceReward = isCompleted
      ? (dropoffData.totalAmount / 2).toFixed(2)
      : 0;
    const pointsReward = isCompleted ? Math.floor(dropoffData.totalAmount) : 0;

    const variables = {
      userName: dropoffData.user.name,
      dropoffId: dropoffData.id,
      status: dropoffData.status,
      statusClass,
      totalWeight: dropoffData.totalWeight,
      totalAmount: dropoffData.totalAmount.toFixed(2),
      pickupMethod: dropoffData.pickupMethod,
      createdAt: new Date(dropoffData.createdAt).toLocaleDateString("id-ID"),
      isCompleted,
      isRejected,
      balanceReward,
      pointsReward,
    };

    const htmlContent = replaceTemplateVariables(template, variables);

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: userEmail,
      subject: `Update Status Dropoff - TrashValue`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

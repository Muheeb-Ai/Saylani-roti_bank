const dialogflow = require("@google-cloud/dialogflow");
const { WebhookClient } = require("dialogflow-fulfillment");
const { google } = require("googleapis");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer"); // Nodemailer added

// Set up the Express app
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Load Google Sheets credentials
const GOOGLE_SHEET_ID = "1ofmhD8-7PCEW9u4KsLp031QidJ5Y5RcLSl9smt-S3jU";
let CREDENTIALS;

try {
    CREDENTIALS = JSON.parse(fs.readFileSync("realworldproblems-tcxa-d090f2592d04.json", "utf8"));
} catch (error) {
    console.error("Error loading Google Sheets credentials file:", error.message);
    process.exit(1);
}

// Initialize Google Sheets API client
const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail", // You can change this to your preferred email provider
    auth: {
        user: "muheebaidev2024@gmail.com", // Replace with your email
        pass: "bzfz btcg ahqb tryx" // Replace with your email password or app password
    }
});

// Route for testing
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });

    function hi(agent) {
        console.log(`Intent => hi`);
        agent.add("Hi! I am the virtual assistant of Saylani Roti Bank. Could you please tell me your name?");
    }

    async function lead(agent) {
        const { person, email, phone } = agent.parameters;
        const userName = person.name;
        const userEmail = email;
        const userPhone = phone;

        // Append data to Google Sheet
        try {
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId: GOOGLE_SHEET_ID,
                range: "Sheet1!A:C",
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: [[userName, userEmail, userPhone]],
                },
            });
            console.log(`Data successfully appended to the sheet: ${appendResponse.data.updates.updatedCells} cells updated.`);
        } catch (error) {
            console.error(`Error appending data to the sheet: ${error.message}`);
            agent.add("There was an error saving your information. Please try again later.");
            return;
        }

        // Send confirmation email
        const mailOptions = {
            from: "muheebaidev2024@gmail.com", // Replace with your email
            to: userEmail,
            subject: "Saylani Roti Bank: Confirmation of Information Received",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; text-align: center; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0;">
                    <img src="https://theazb.com/wp-content/uploads/2022/10/Saylani-Welfare.jpg" alt="Saylani Roti Bank" style="max-width: 80%; height: auto; margin-bottom: 20px; border-radius: 8px;">

                    <h2 style="color: #4CAF50; font-size: 24px; font-weight: bold;">Thank You for Reaching Out!</h2>

                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Dear <b style="color: #4CAF50;">${userName}</b>,
                    </p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        We have successfully received your information. Our team at <b>Saylani Roti Bank</b> will be in touch with you shortly to assist you further.
                    </p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        We value your trust and look forward to serving you. Should you need any further assistance, feel free to reach out to us.
                    </p>

                    <p style="font-size: 16px; color: #333; line-height: 1.6; font-weight: bold;">
                        Warm regards,<br>
                        <span style="color: #4CAF50;">Saylani Roti Bank Team</span>
                    </p>

                    <hr style="border-top: 1px solid #ddd; margin-top: 40px;">
                    <p style="font-size: 14px; color: #777; margin-top: 20px;">
                        <i>If you have any questions, feel free to contact us anytime!</i>
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error.message);
            } else {
                console.log("Confirmation email sent:", info.response);
            }
        });

        // Respond to the user
        agent.add(`Thank you, ${userName}. Your email is ${userEmail} and phone number is ${userPhone}. We will get back to you soon. Please check your email.`);
        console.log(`${userName} (${userEmail}, ${userPhone}) was added to the sheet.`);
    }

    function bookAppointment(agent) {
        const calendlyLink = "https://calendly.com/muheebaidev2024"; // Replace with your actual Calendly link
        agent.add(`You can book an appointment here: ${calendlyLink}`);
        console.log("Calendly link shared with the user.");
    }

    // Intent map
    let intentMap = new Map();
    intentMap.set("hi", hi);
    intentMap.set("lead", lead);
    intentMap.set("bookAppointment", bookAppointment);
    agent.handleRequest(intentMap);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

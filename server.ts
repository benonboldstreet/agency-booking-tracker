import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up Express standard body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API router FIRST
  app.post("/api/send-email", async (req, res) => {
    try {
      console.log("POST /api/send-email request received:", req.body);
      
      const { 
        to, 
        teamLeaderName, 
        service, 
        shiftDate, 
        startTime, 
        endTime, 
        shiftType, 
        internalRef,
        
        // backup keys
        staff_name,
        house_name,
        agency_name,
        shift_detail
      } = req.body;

      const finalTo = to || process.env.RESEND_TO_EMAIL || "recipient@example.com";
      const finalLeader = teamLeaderName || "No Supervisor";
      const finalService = service || house_name || "Unassigned House";
      const finalDate = shiftDate || "Not Specified";
      const finalStart = startTime || (shift_detail ? shift_detail.split(' ')[0] : "08:00");
      const finalEnd = endTime || (shift_detail ? shift_detail.split(' ').pop() : "20:00");
      const finalType = shiftType || "Custom shift";
      const finalRef = internalRef || req.body.ref_number || "BK-UNKNOWN";
      const finalStaff = staff_name || "Staff Hired";

      console.log(`[Express /api/send-email] Sending alert for ${finalRef} to ${finalTo}`);

      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.warn("[Express /api/send-email] RESEND_API_KEY not configured. Running in sandbox/dry-run mode.");
        return res.status(200).json({ 
          message: "Email would be sent (Sandbox/Dry Run mode)",
          warning: "Please configure RESEND_API_KEY env variable in app settings to send real transaction emails.",
          data: {
            to: finalTo,
            ref: finalRef,
            staff: finalStaff,
            service: finalService,
            leader: finalLeader,
            date: finalDate,
            time: `${finalStart} - ${finalEnd}`,
            type: finalType
          }
        });
      }

      // If we have an API Key, send email via Resend rest API endpoint
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 800;">Agency Shift Booking Registered</h2>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">
              Booking ID: <strong style="font-family: monospace; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">${finalRef}</strong>
            </p>
          </div>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Hired Staff:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${finalStaff}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Work Location:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${finalService}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Booking Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${finalDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Time Window:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${finalStart} - ${finalEnd}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Shift Type:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${finalType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Supervisor:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${finalLeader}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 24px; font-size: 13px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0;">This notification is dispatched instantly following save/modify events from the Agency Booking system.</p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Agency Booking Tracker. All rights reserved.
          </div>
        </div>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: finalTo,
          subject: `Shift Booked: ${finalRef} - ${finalStaff}`,
          html: emailHtml
        })
      });

      const bodyText = await response.text();
      let resendJson;
      try {
        resendJson = JSON.parse(bodyText);
      } catch (e) {
        resendJson = { raw: bodyText };
      }

      if (response.ok) {
        console.log("[Express /api/send-email] Sent successfully via Resend API:", resendJson);
        return res.status(200).json({ 
          message: "Email sent successfully", 
          id: resendJson.id 
        });
      } else {
        console.error("[Express /api/send-email] Resend API failed:", resendJson);
        return res.status(response.status).json({ 
          error: "Resend API returned failure", 
          details: resendJson 
        });
      }
    } catch (err: any) {
      console.error("[Express /api/send-email] Critical failure during sending-email routine:", err);
      return res.status(500).json({ 
        error: "Server Error", 
        message: err.message || "An unexpected error occurred." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

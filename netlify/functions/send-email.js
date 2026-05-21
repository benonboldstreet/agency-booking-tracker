/**
 * Netlify serverless function for dispatching confirmation emails.
 * Supports modern Node.js global fetch and fallback structures.
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: 'Method Not Allowed' 
    };
  }

  try {
    const { 
      to, 
      teamLeaderName, 
      service, 
      shiftDate, 
      startTime, 
      endTime, 
      shiftType, 
      internalRef,
      
      // Secondary compatibility keys
      staff_name,
      house_name,
      agency_name,
      shift_detail
    } = JSON.parse(event.body);

    const finalTo = to || process.env.RESEND_TO_EMAIL || "recipient@example.com";
    const finalLeader = teamLeaderName || "No Supervisor";
    const finalService = service || house_name || "Unassigned House";
    const finalDate = shiftDate || "Not Specified";
    const finalStart = startTime || (shift_detail ? shift_detail.split(' ')[0] : "08:00");
    const finalEnd = endTime || (shift_detail ? shift_detail.split(' ').pop() : "20:00");
    const finalType = shiftType || "Custom shift";
    const finalRef = internalRef || "BK-UNKNOWN";
    const finalStaff = staff_name || "Staff Hired";

    console.log(`[Email Dispatcher] Target Email: ${finalTo}. Internal Ref: ${finalRef}`);

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[Email Notice] API key is missing. Simulating delivery: booking ref ${finalRef} would be emailed to ${finalTo}.`);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: 'Email would be sent',
          simulated: true,
          details: {
            to: finalTo,
            staffName: finalStaff,
            serviceLocation: finalService,
            shiftDate: finalDate,
            timeWindow: `${finalStart} - ${finalEnd}`,
            shiftType: finalType,
            teamLeaderName: finalLeader,
            internalRef: finalRef
          }
        })
      };
    }

    // Prepare fully complete responsive HTML template
    const htmlContent = `
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
          <p style="margin: 0;"> This notification is dispatched instantly following save/modify events.</p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Agency Booking Tracker. All rights reserved.
        </div>
      </div>
    `;

    // Global fetch is built into Netlify Node 18+ environments
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: finalTo,
        subject: `Shift Booked: ${finalRef} - ${finalStaff}`,
        html: htmlContent
      })
    });

    const bodyText = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(bodyText);
    } catch (e) {
      jsonResponse = { raw: bodyText };
    }

    if (response.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: 'Email sent successfully via Resend API', id: jsonResponse.id })
      };
    } else {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: 'Resend API returned failure', details: jsonResponse })
      };
    }
  } catch (err) {
    console.error("Critical error in send-email Netlify function:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Internal Server Error', message: err.message })
    };
  }
};

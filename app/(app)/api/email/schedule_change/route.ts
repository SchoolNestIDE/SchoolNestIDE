import { NextRequest, NextResponse } from "next/server";

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export async function POST(req: NextRequest) {
  try {
    const { school, scheduleName, changedBy, reason } = await req.json();
    
    const formData = new FormData();
    formData.append('access_key', 'f3c8064a-1eaf-4706-8b05-73a906341728');
    formData.append('to', 'admin@schoolnest.org');
    formData.append('from_name', 'SchoolNest System');
    formData.append('subject', `Schedule Change Alert: ${school}`);
    formData.append('message', `
      A schedule change has occurred:
      
      School: ${school}
      New Schedule: ${scheduleName}
      Changed By: ${changedBy || 'System'}
      Reason: ${reason || 'Not provided'}
      Time: ${new Date().toLocaleString()}
    `);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({ success: true, message: "Notification email sent" });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
} 
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { bill, customerEmail, emailSettings } = await request.json()

    if (!emailSettings.apiKey || !emailSettings.senderEmail) {
      return NextResponse.json({ error: "Email configuration missing" }, { status: 400 })
    }

    if (!emailSettings.apiKey.startsWith("SG.")) {
      return NextResponse.json({ error: "Invalid SendGrid API key format" }, { status: 400 })
    }

    if (emailSettings.apiKey.length < 50) {
      return NextResponse.json({ error: "SendGrid API key appears to be incomplete" }, { status: 400 })
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Receipt - ${bill.id}</h2>
        <p><strong>Date:</strong> ${bill.date}</p>
        <p><strong>Customer:</strong> ${bill.customerName}</p>
        <p><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</p>
        
        <h3 style="color: #333;">Items:</h3>
        <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total</th>
          </tr>
          ${bill.items
            .map(
              (item: any) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">₹${item.price.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
        
        <h3 style="color: #333; margin-top: 20px;"><strong>Total Amount: ₹${bill.total.toFixed(2)}</strong></h3>
        
        <p style="margin-top: 20px; color: #666;">Thank you for your business!</p>
      </div>
    `

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailSettings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: customerEmail }],
            subject: `Receipt - ${bill.id}`,
          },
        ],
        from: {
          email: emailSettings.senderEmail,
          name: emailSettings.senderName || "Retail Store",
        },
        content: [
          {
            type: "text/html",
            value: emailContent,
          },
        ],
      }),
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorData = await response.text()
      console.error("SendGrid error:", errorData)

      let parsedError
      try {
        parsedError = JSON.parse(errorData)
      } catch {
        parsedError = { errors: [{ message: errorData }] }
      }

      if (parsedError.errors && parsedError.errors.length > 0) {
        const errorMessage = parsedError.errors[0].message
        if (errorMessage.includes("invalid") || errorMessage.includes("expired") || errorMessage.includes("revoked")) {
          return NextResponse.json(
            {
              error:
                "Invalid or expired SendGrid API key. Please verify your API key in settings and ensure it has mail sending permissions.",
              details:
                "The API key provided is not valid or has been revoked. Please generate a new API key from your SendGrid dashboard.",
            },
            { status: 401 },
          )
        }
        if (errorMessage.includes("sender identity")) {
          return NextResponse.json(
            {
              error: "Sender email not verified. Please verify your sender email in SendGrid.",
              details: "The sender email address must be verified in your SendGrid account before sending emails.",
            },
            { status: 403 },
          )
        }
      }

      return NextResponse.json(
        {
          error: "Failed to send email",
          details: parsedError.errors?.[0]?.message || "Unknown SendGrid error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing the email request",
      },
      { status: 500 },
    )
  }
}

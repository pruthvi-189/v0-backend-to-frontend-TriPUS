import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { bill, customerEmail, emailSettings } = await request.json()

    if (!emailSettings.apiKey || !emailSettings.senderEmail) {
      return NextResponse.json({ error: "Email configuration missing" }, { status: 400 })
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
          name: emailSettings.senderName,
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
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, senderEmail } = await request.json()

    if (!apiKey || !senderEmail) {
      return NextResponse.json({ error: "API key and sender email are required" }, { status: 400 })
    }

    if (!apiKey.startsWith("SG.")) {
      return NextResponse.json({ error: "Invalid SendGrid API key format. Must start with 'SG.'" }, { status: 400 })
    }

    // Test the API key by making a simple request to SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      // If profile request succeeds, test sender verification
      const senderResponse = await fetch("https://api.sendgrid.com/v3/verified_senders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (senderResponse.ok) {
        const senderData = await senderResponse.json()
        const isVerified = senderData.results?.some(
          (sender: any) => sender.from_email === senderEmail && sender.verified,
        )

        if (isVerified) {
          return NextResponse.json({
            success: true,
            message: "API key is valid and sender email is verified!",
          })
        } else {
          return NextResponse.json(
            {
              error: `Sender email "${senderEmail}" is not verified in SendGrid. Please verify it in Settings → Sender Authentication.`,
            },
            { status: 403 },
          )
        }
      } else {
        return NextResponse.json({
          success: true,
          message:
            "API key is valid, but couldn't verify sender email. Please ensure your sender email is verified in SendGrid.",
        })
      }
    } else {
      const errorData = await response.text()
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
              error: "Invalid or expired SendGrid API key. Please create a new API key in your SendGrid dashboard.",
            },
            { status: 401 },
          )
        }
      }

      return NextResponse.json(
        {
          error: "API key validation failed. Please check your SendGrid API key.",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("SendGrid test error:", error)
    return NextResponse.json(
      {
        error: "Failed to test API key. Please check your connection and try again.",
      },
      { status: 500 },
    )
  }
}

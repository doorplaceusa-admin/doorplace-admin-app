import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = Buffer.from(
      `${process.env.IPLUM_API_KEY}:${process.env.IPLUM_API_SECRET}`
    ).toString("base64");

    const res = await fetch("https://api.iplum.com/api/v1/account", {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: "iPlum error", status: res.status, details: text },
        { status: res.status }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

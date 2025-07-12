import type React from "react"
import type { Metadata } from "next"
import { Victor_Mono } from "next/font/google"
import "./globals.css"

const victorMono = Victor_Mono({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={victorMono.className}>
      <body>{children}</body>
    </html>
  )
}

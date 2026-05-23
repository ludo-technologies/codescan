import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

const jakarta = Plus_Jakarta_Sans({
	variable: "--font-jakarta",
	subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
	variable: "--font-jetbrains",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL(getSiteUrl()),
	title: "codescan.dev — Simple security checks for public GitHub repos",
	description:
		"Free security checks for public GitHub repositories. Find risky code, exposed keys, and outdated packages, then get a shareable letter-grade report.",
	keywords: [
		"GitHub security scanner",
		"repository security checker",
		"code security checker",
		"exposed API keys",
		"outdated packages",
		"open source security",
	],
	openGraph: {
		title: "codescan.dev — Simple security checks for public GitHub repos",
		description:
			"Scan any public GitHub repo for risky code, exposed keys, and outdated packages. Get a letter-grade security report you can share.",
		type: "website",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			{GA_MEASUREMENT_ID && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
						strategy="afterInteractive"
					/>
					<Script id="google-analytics" strategy="afterInteractive">
						{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
					</Script>
				</>
			)}
			<body className={`${jakarta.variable} ${jetbrains.variable} antialiased`}>
				{children}
				<Footer />
			</body>
		</html>
	);
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
	const siteUrl = getSiteUrl();
	const routes = ["", "/examples", "/methodology", "/privacy", "/terms"];

	return routes.map((route) => ({
		url: `${siteUrl}${route}`,
	}));
}

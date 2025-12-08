import { getWebsiteSettings } from "../services/website/settingService";

export async function GET() {
  const settings = await getWebsiteSettings();
  return Response.json(settings);
}

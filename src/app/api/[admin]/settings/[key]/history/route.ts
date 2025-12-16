import { checkSystemAdminRequire } from "@/app/api/auth/utils";
import { getSettingHistory } from "@/app/api/services/website/settingService";
import { checkRequire } from "@/app/utils/client";

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await checkSystemAdminRequire();
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;
      
  const { key } = await params;
  const history = await getSettingHistory(key, 20);
  return Response.json(history);
}

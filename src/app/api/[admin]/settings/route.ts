import { checkRequire } from "@/app/utils/client";
import { checkSystemAdminRequire } from "../../auth/utils";
import { getAllSettingsForAdmin } from "../../services/website/settingService";

export async function GET() {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    const data = await getAllSettingsForAdmin();
    return Response.json(data);
}

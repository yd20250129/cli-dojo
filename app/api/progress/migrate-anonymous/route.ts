import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { migrateAnonymousProgressIfNeeded } from "@/lib/server/progress-repository";
import { parseAnonymousProgressState } from "@/lib/shared/validation";
import type { MigrateAnonymousProgressRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = requireJsonObject(await request.json()) as Partial<MigrateAnonymousProgressRequest>;

    if (!body.anonymousProgress) {
      throw new AppError("UNKNOWN", 400, "移行対象の進捗データがありません");
    }

    const result = await migrateAnonymousProgressIfNeeded({
      userId: user.userId,
      anonymousProgress: parseAnonymousProgressState(body.anonymousProgress),
    });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

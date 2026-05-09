import { clerkClient } from "@clerk/nextjs/server";

import { validateDisplayName } from "@/lib/shared/validation";
import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { updateUserDisplayName } from "@/lib/server/users-repository";
import type { UpdateProfileRequest } from "@/types";

function splitDisplayName(displayName: string) {
  const parts = displayName.split(" ");

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const json = await request.json().catch(() => null);
    const body = requireJsonObject(json);
    const payload = body as Partial<UpdateProfileRequest>;
    const validation = validateDisplayName(payload.displayName);

    if (!validation.ok || !validation.value) {
      throw new AppError("UNKNOWN", 400, validation.errors[0] ?? "表示名が不正です");
    }

    const { firstName, lastName } = splitDisplayName(validation.value);
    const client = await clerkClient();

    await client.users.updateUser(user.clerkUserId, {
      firstName,
      lastName: lastName || undefined,
    });

    const updatedUser = await updateUserDisplayName({
      userId: user.userId,
      clerkUserId: user.clerkUserId,
      displayName: validation.value,
    });

    return Response.json({
      data: {
        displayName: updatedUser.displayName ?? validation.value,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

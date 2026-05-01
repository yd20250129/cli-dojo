import { currentUser } from "@clerk/nextjs/server";

function isClerkUserNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (!("clerkError" in error) || !("status" in error)) {
    return false;
  }

  return error.clerkError === true && error.status === 404;
}

export async function getCurrentUserSafely() {
  try {
    return await currentUser();
  } catch (error) {
    if (isClerkUserNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

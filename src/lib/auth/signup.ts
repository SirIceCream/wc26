function isTruthy(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

export function isSignupEnabled() {
  return isTruthy(process.env.SIGNUPS_ENABLED);
}

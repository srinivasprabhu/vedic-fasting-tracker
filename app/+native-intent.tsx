/**
 * Pass through incoming native URLs. Returning '/' unconditionally breaks deep links
 * and can interfere with in-app navigation to root stack screens (e.g. /did-you-know).
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    return path;
  } catch {
    return '/';
  }
}

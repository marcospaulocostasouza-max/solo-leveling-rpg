export function gachaDebug(event: string, startedAt?: number) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[GACHA DEBUG] ${event}${startedAt === undefined ? '' : `: ${Math.round(performance.now() - startedAt)}ms`}`);
  }
}

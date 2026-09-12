/**
 * Seconds -> frames, in one place, so every template's calculateMetadata and
 * every <Sequence> round the same way. Mixing Math.round here and Math.floor
 * there is how a reel ends up one frame short of its last beat.
 */
export const frames = (seconds: number, fps: number) => Math.round(seconds * fps);

/** Total length of a list of section lengths given in seconds. */
export const totalFrames = (sections: number[], fps: number) =>
  sections.reduce((n, s) => n + frames(s, fps), 0);

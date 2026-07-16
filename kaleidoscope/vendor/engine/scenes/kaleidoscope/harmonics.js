function associatedLegendre(l, mAbs, cosTheta) {
    const x = Math.max(-1, Math.min(1, cosTheta));
    if (l === 0 && mAbs === 0)
        return 1;
    if (l === 1 && mAbs === 0)
        return x;
    if (l === 1 && mAbs === 1)
        return Math.sqrt(1 - x * x);
    if (l === 2 && mAbs === 0)
        return 0.5 * (3 * x * x - 1);
    if (l === 2 && mAbs === 1)
        return 3 * x * Math.sqrt(1 - x * x);
    if (l === 2 && mAbs === 2)
        return 3 * (1 - x * x);
    if (l === 3 && mAbs === 0)
        return 0.5 * x * (5 * x * x - 3);
    if (l === 3 && mAbs === 1)
        return 1.5 * (5 * x * x - 1) * Math.sqrt(1 - x * x);
    if (l === 3 && mAbs === 2)
        return 15 * x * (1 - x * x);
    if (l === 3 && mAbs === 3)
        return 15 * (1 - x * x) * Math.sqrt(1 - x * x);
    if (l === 4 && mAbs === 0)
        return 0.125 * (35 * x ** 4 - 30 * x * x + 3);
    if (l === 4 && mAbs === 1)
        return 2.5 * x * (7 * x * x - 3) * Math.sqrt(1 - x * x);
    if (l === 4 && mAbs === 2)
        return 7.5 * (7 * x * x - 1) * (1 - x * x);
    if (l === 4 && mAbs === 3)
        return 105 * x * (1 - x * x) * Math.sqrt(1 - x * x);
    if (l === 4 && mAbs === 4)
        return 105 * (1 - x * x) ** 2;
    return 0;
}
function factorialRatio(lMinusM, lPlusM) {
    let result = 1;
    for (let k = lMinusM + 1; k <= lPlusM; k++)
        result /= k;
    return result;
}
function sphericalHarmonicNorm(l, mAbs) {
    return Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * factorialRatio(l - mAbs, l + mAbs));
}
export function realSphericalHarmonic(l, m, theta, phi) {
    const lClamped = Math.min(4, Math.max(0, l));
    const maxM = lClamped;
    const mClamped = Math.max(-maxM, Math.min(maxM, m));
    const mAbs = Math.abs(mClamped);
    if (mAbs > lClamped)
        return 0;
    const p = associatedLegendre(lClamped, mAbs, Math.cos(phi));
    const norm = sphericalHarmonicNorm(lClamped, mAbs);
    if (mClamped > 0)
        return norm * p * Math.cos(mClamped * theta);
    if (mClamped < 0)
        return norm * p * Math.sin(mAbs * theta);
    return norm * p;
}
export function sampleSphericalHarmonics(nx, ny, t, l, m) {
    const r = Math.min(1, Math.hypot(nx, ny));
    const azimuth = Math.atan2(ny, nx);
    const colatitude = r * Math.PI;
    const phase = t * 0.00045 * (Math.abs(m) + 1);
    const value = realSphericalHarmonic(l, m, azimuth + phase, colatitude);
    return Math.min(1, Math.max(0, value * 0.5 + 0.5));
}
//# sourceMappingURL=harmonics.js.map
/**
 * Shared status / tone union used across the library's tone-colored components
 * (badge, metric tile, hero, flow, segmented …). One canonical type so apps and
 * components agree on the same five tones instead of each re-declaring them.
 *
 * `StrctProgress` / `StrctGauge` use the narrower `StrctChartStatus` (no
 * `'neutral'`) since a bar/gauge is always tinted.
 */
export type StrctStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/**
 * Optional value-driven thresholds for meters (`StrctProgress`, `StrctGauge`).
 * When supplied, the component derives its own status from the value:
 * `value >= critical → 'critical'`, `>= warning → 'warning'`, otherwise the
 * healthy base ('success' by default).
 */
export interface StrctThresholds {
  warning?: number;
  critical?: number;
}

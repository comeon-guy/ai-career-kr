/**
 * @typedef {Object} Section3HeadlineSegment
 * @property {string} text
 * @property {boolean} [emphasize]
 */

/**
 * @typedef {Object} Section3HeroInsight
 * @property {string} badge_title
 * @property {Section3HeadlineSegment[]} headline_segments
 * @property {string[]} proof_items
 */

/**
 * @typedef {Object} Section3AxisItem
 * @property {string} label
 * @property {string} description
 */

/**
 * @typedef {Object} Section3CoreAxis
 * @property {string} title
 * @property {string} circle_label
 * @property {string} circle_sub
 * @property {Section3AxisItem[]} axes
 */

/**
 * @typedef {Object} Section3ShiftLanesHeader
 * @property {string} title
 * @property {string} label_before
 * @property {string} label_after
 */

/**
 * @typedef {Object} Section3ShiftLane
 * @property {string} before_text
 * @property {string} after_text
 */

/**
 * @typedef {Object} Section3StrategyCard
 * @property {number} number
 * @property {string} title
 * @property {string} body
 */

/**
 * @typedef {Object} Section3WorkStyleData
 * @property {Section3HeroInsight} hero_insight
 * @property {Section3CoreAxis} core_axis
 * @property {Section3ShiftLanesHeader} shift_lanes_header
 * @property {Section3ShiftLane[]} shift_lanes
 * @property {Section3StrategyCard[]} strategy_cards
 */

export {};

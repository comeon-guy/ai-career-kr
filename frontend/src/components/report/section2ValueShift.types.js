/**
 * @typedef {Object} Section2HeadlineSegment
 * @property {string} text
 * @property {boolean} [emphasize] — 강조(파란 굵게)
 */

/**
 * @typedef {Object} Section2HeroInsight
 * @property {string} eyebrow
 * @property {Section2HeadlineSegment[]} headline_segments
 * @property {string} [supporting_text] — 짧은 보조 문단(핵심 문장과 중복 금지)
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} Section2GravityBox
 * @property {string} label
 * @property {string} text
 */

/**
 * @typedef {Object} Section2GravityShift
 * @property {string} title
 * @property {Section2GravityBox} from_box
 * @property {Section2GravityBox} to_box
 * @property {string} [footer_note]
 */

/**
 * @typedef {Object} Section2ComparisonRow
 * @property {string} work_area
 * @property {string} decline_focus
 * @property {string} rise_focus
 */

/**
 * @typedef {Object} Section2AccordionItem
 * @property {string} title
 * @property {string} body
 */

/**
 * @typedef {Object} Section2WorkCard
 * @property {string[]} bullets
 * @property {Section2AccordionItem[]} accordions
 */

/**
 * @typedef {Object} Section2ValueShiftData
 * @property {Section2WorkCard} decline_work
 * @property {Section2WorkCard} rise_work
 * @property {boolean} [has_legacy_decor]
 * @property {Section2HeroInsight} [hero_insight] — optional v45 legacy
 * @property {Section2GravityShift} [gravity_shift] — optional v45 legacy
 * @property {Section2ComparisonRow[]} [comparison_rows] — optional v45 legacy
 */

export {};

/**
 * @typedef {Object} Section4HeadlineSegment
 * @property {string} text
 * @property {boolean} [emphasize]
 */

/**
 * @typedef {Object} Section4IntegratedInsight
 * @property {string} eyebrow
 * @property {Section4HeadlineSegment[]} headline_segments
 * @property {string} supporting_text
 */

/**
 * @typedef {Object} Section4PortfolioSegment
 * @property {"human"|"collab"|"automation"} kind
 * @property {number} percent
 * @property {string} label
 * @property {string} sublabel
 */

/**
 * @typedef {Object} Section4Portfolio
 * @property {string} title
 * @property {Section4PortfolioSegment[]} segments
 */

/**
 * @typedef {Object} Section4Filter
 * @property {string} id
 * @property {string} label
 * @property {boolean} [default]
 */

/**
 * @typedef {Object} Section4TaskMetrics
 * @property {number} importance
 * @property {number|string} frequency_display
 * @property {number} weight_percent
 */

/**
 * @typedef {Object} Section4TaskCard
 * @property {string} id
 * @property {string[]} filter_group
 * @property {number} order
 * @property {string} title
 * @property {"human"|"collab"|"automation"} ai_role_type
 * @property {Section4TaskMetrics} metrics
 * @property {string[]} capabilities
 * @property {string} ai_helps
 * @property {string} human_owns
 * @property {string} [key_change_line] 핵심 변화 한줄(선택) — 없으면 클라이언트에서 유도
 * @property {string[]} [bullets_primary] 스캔형 UI 1열(선택)
 * @property {string[]} [bullets_secondary] 스캔형 UI 2열(선택)
 * @property {string} [task_work_type] LLM 메타(선택) — 디버깅·품질 검증용, UI 비필수
 * @property {string} [onet_task_id] source task id — DB 내러티브와 리포트 `task-${id}` 매칭
 * @property {string} [task_id] 하위 호환
 */

/**
 * @typedef {Object} Section4CareerInsight
 * @property {number} number
 * @property {string} title
 * @property {string} body
 */

/**
 * @typedef {Object} Section4TaskAiRoleData
 * @property {string} [section_title]
 * @property {Section4IntegratedInsight} integrated_insight
 * @property {Section4Portfolio} portfolio
 * @property {Section4Filter[]} filters
 * @property {Section4TaskCard[]} task_cards
 * @property {Section4CareerInsight[]} career_insights
 */

export {};

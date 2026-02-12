/**
 * 前端常量与配置（API 基地址、脑图布局、连线形态、画布缩放等）
 */
export const API_BASE = "http://localhost:8000";

export const LAYOUT = {
  centerX: 2000,
  centerY: 2000,
  radiusLevel1: 420,
  radiusStep: 380,
  directions: [270, 330, 30, 90, 150, 210],
  nodeWidthRoot: 260,
  nodeWidth: 200,
  nodeWidthSection: 220,
  nodeHeight: 80,
  perpGap: 130,
  minFanAnglePerChild: 28,
  maxFanAngleTotal: 140,
};

export const CONNECTOR_MORPHOLOGY = {
  THICK_STRAIGHT: "thick_straight",
  THIN_STRAIGHT: "thin_straight",
  THIN_CURVED: "thin_curved",
  THICK_CURVED: "thick_curved",
};

export const CANVAS_SCALE_MIN = 0.25;
export const CANVAS_SCALE_MAX = 3;

export const ALLOWED_DOC_TYPES = [".txt", ".pdf", ".docx", ".md"];

export const SUPER_AGENT_BURST_IDS = [
  "super-agent-burst-1",
  "super-agent-burst-2",
  "super-agent-burst-3",
  "super-agent-burst-4",
];

// ─────────────────────────────────────────────────────────────────────────────
//  Barrel file — Punto de entrada único para el paquete tracker-core
//  Re-exporta todos los tipos, funciones y utilidades públicas.
//  Uso: import { Candidate, filterByCriteria, validateCandidateForm } from 'tracker-core';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tipos y modelos ─────────────────────────────────────────────────────────
export type {
  CandidateStatus,
  CandidateStage,
  Candidate,
  Note,
  User,
  BaseEntity,
  CandidateFormData,
  CandidatePatchPayload,
  CandidatePutPayload,
  CandidatePostPayload,
  NotePostPayload,
  ApiResponse,
  LoadingState,
  SortCriterion,
  FilterCriterion,
  BinarySearchOptions,
  AggregateResult,
  ValidationResult,
} from "./types/models";

export {
  STATUS_OPTIONS,
  STAGE_OPTIONS,
} from "./types/models";

// ─── Colecciones (filtrado, ordenamiento, paginación) ────────────────────────
export {
  matchesCriterion,
  filterByCriteria,
  filterByCriteriaOr,
  filterByStatus,
  filterByStage,
  filterByExperienceRange,
  sortByField,
  sortByMultipleCriteria,
  paginate,
  totalPages,
} from "./utils/collections";

// ─── Búsqueda ────────────────────────────────────────────────────────────────
export {
  linearSearchByIdentity,
  linearSearchAll,
  linearSearchByText,
  linearSearchMultiField,
  binarySearchIndex,
  binarySearch,
  binarySearchNumber,
  binarySearchRange,
} from "./utils/search";

// ─── Agregaciones y reportes ─────────────────────────────────────────────────
export type {
  StatusReport,
  StageReport,
  ExperienceReport,
} from "./utils/transformations";

export {
  count,
  sum,
  avg,
  max,
  min,
  aggregate,
  groupBy,
  countBy,
  distinct,
  reportByStatus,
  reportByStage,
  reportExperience,
} from "./utils/transformations";

// ─── Validaciones ────────────────────────────────────────────────────────────
export {
  validateCandidateForm,
  validateCandidateComplete,
  validateNote,
  canAdvanceToTechnical,
  canReceiveOffer,
  validatePipelineFlow,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isInRange,
} from "./utils/validations";
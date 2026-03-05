# Codebase Summary

A modular, store-driven React + TypeScript framework for building admin-like UIs. It focuses on lists with filtering/pagination, per-item detail views with actions, and robust, DTO-driven forms. Performance is boosted via deferred rendering and React 19 features (useId, useDeferredValue, useTransition). Data flow is orchestrated through a per-page store registry with on-demand registration.

---

## Core Technologies & Patterns

- React + TypeScript
- React 19 features
  - useId for stable keys
  - useDeferredValue for expensive components
  - useTransition for smooth UX during mutations and API calls
- Per-page store registry (likely Zustand-like)
  - Helpers: registerStore, deregisterStore, useRegisteredStore
  - Stores per page: list, single, form
- DTO-driven forms with validation
  - dtoToFields(dto) converts a DTO class to form field config
  - react-hook-form + class-validatorResolver
- API Abstractions
  - useApiQuery, useApiMutation, useApiPaginatedQuery
  - Supports optimistic updates and transitions
- Error handling
  - ErrorBoundary with ErrorFallback
- UX niceties
  - Toasts (sonner)
  - Confirm dialogs with i18n support
  - Deferred loading for heavy components
- Strongly-typed generics across handlers and stores

---

## Core Concepts

- Stores & Registration
  - Per-page stores created on demand and registered with keys like:
    - list: {storeKey}-list
    - single: {storeKey}-single
    - form: {storeKey}-form
  - Lifecycle: registerStore on mount, deregisterStore on unmount
- Action Components Mapping
  - Action components are supplied as arrays and mapped by a string action to a React component
  - Two main handlers:
    - ActionComponentHandler (for single item)
    - ListActionComponentHandler (for list items; can reference a single item store)
- Deferred Rendering & UX
  - useDeferredValue wraps action component maps for performance
  - useId provides stable keys for rendered components
  - useTransition batches updates during data mutations and API calls
- DTOs & Validation
  - DTOs drive form fields via dtoToFields
  - Class-validator-based validation via resolver
  - Fields memoized and re-derived when DTO changes
- API Layer
  - useApiQuery: fetch data for a single item
  - useApiMutation: mutations with optimistic state
  - useApiPaginatedQuery: paginated list data with filters, sorting, and transitions

---

## Key Components & Responsibilities

- ActionComponentHandler
  - Renders a per-item action component based on the current action in the store
  - Builds a map { action: Component } from actionComponents
  - Uses useDeferredValue for performance
  - Handles missing/not-found stores gracefully

- ListActionComponentHandler
  - Similar to ActionComponentHandler but for list context
  - Optional singleStore reference for cross-item interactions
  - Includes data attributes for debugging/metrics
  - Uses transitions to indicate pending actions

- ListHandler
  - Drives a paginated, filterable list
  - Props: queryFn, deleteFn, ListComponent, initialParams, actionComponents, dto, etc.
  - Store lifecycle: lazy creation and registration of the list store
  - DTO-driven fields for filtering; default form values prepared
  - API pagination via useApiPaginatedQuery; debounced input updates trigger API calls
  - UI composition: ListComponent + ListActionComponentHandler + DeleteDialog
  - Form integration for filtering

- DeleteDialog
  - Inline deletion flow with a confirmation dialog
  - Integrates with API mutation, i18n, and toasts
  - Triggers onDeleteSuccess after successful deletion

- SingleHandler
  - Detail view for a single item with per-item actions
  - Creates/loads a single-item store
  - useApiQuery loads the item by payload
  - Renders SingleComponent + ActionComponentHandler
  - Wrapped with ErrorBoundary

- FormHandler
  - Create/Update form driven by a DTO
  - DTO-derived fields via dtoToFields(dto)
  - react-hook-form with class-validator resolver
  - Transition-based submissions with useTransition
  - Dirty-data handling for edit mode
  - Dedicated form store; syncs with API mutations
  - UI: Form wrapper around provided FormComponent; ErrorBoundary around the form

---

## Data Flow Overview

- List Flow
  1. Build list store from initial filters and DTO-derived fields
  2. Form changes update store.filters (debounced)
  3. setFilters triggers the paginated API query
  4. API returns data + pagination; store updated
  5. List UI renders via ListComponent; per-item actions via ListActionComponentHandler
  6. Delete flow via DeleteDialog

- Single Flow
  1. Create/load single-item store
  2. Payload changes trigger useApiQuery to fetch item
  3. Render SingleComponent and item actions via ActionComponentHandler

- Form Flow
  1. DTO-derived fields with initialValues
  2. Submit via mutationFn; transitions + toasts provide UX
  3. On success/error, store state updated and callbacks fired

---

## Data Types & Safety

- Generics used extensively to ensure type safety across:
  - IData, TData, TListData, TExtraProps, TSingleData, TSingleExtraProps, etc.
- Action components typed to align with their respective stores
- DTO-driven typing ensures form fields map to backend DTOs
- API primitives use explicit interfaces (IPaginatedResponse, IListQueryParams, etc.)

---

## UX Enhancements

- Deferred rendering of heavy action components
- Transitions for smooth UX during submissions and API calls
- Toasts for success and error feedback
- Confirm dialogs with i18n support
- Error boundaries around major sections for resilience

---

## File / Module Highlights

- Action handling
  - ActionComponentHandler
  - ListActionComponentHandler
- Handlers
  - ListHandler
  - SingleHandler
  - FormHandler
- UI & UX
  - DeleteDialog
  - Form wrapper components (Form)
  - ErrorFallback
- DTO & Utilities
  - dtoToFields
  - pickKeys
  - getDirtyData
- Stores & Hooks
  - registerStore, deregisterStore, useRegisteredStore
  - useListHandlerStore, useSingleHandlerStore, useFormHandlerStore
  - useApiQuery, useApiMutation, useApiPaginatedQuery

---

## How to Extend / Customize

- Add new ListComponent / SingleComponent / FormComponent and wire them into ListHandler, SingleHandler, or FormHandler.
- Provide actionComponents arrays to customize per-item actions (single or list contexts).
- Extend DTOs to control fields via dtoToFields and adjust validation via class-validator.
- Create new per-page stores by leveraging the store registry system.

---

## Quick Start / Usage Outline

- List
  - Implement queryFn for paginated data
  - Provide ListComponent and optional actionComponents
  - Optional dto to enable DTO-driven filters

- Single
  - Implement queryFn for a single item
  - Provide SingleComponent and optional actionComponents
  - Optional singleProps for per-item customization

- Form
  - Implement mutationFn for create/update
  - Provide FormComponent and dto for field configuration
  - Supply initialValues, validationMode, and callbacks for success/error

---

This codebase targets a modular, type-safe admin-style UI pattern: lists with filters and pagination, detail views with actions, and robust form handling driven by DTOs, with an emphasis on performance via deferred rendering and fluid UX through transitions and error handling.
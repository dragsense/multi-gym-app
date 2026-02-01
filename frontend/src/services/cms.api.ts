// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type {
  TCreateEmailTemplateData,
  TUpdateEmailTemplateData,
  TCreatePageData,
  TUpdatePageData,
  TCreateFaqData,
  TUpdateFaqData,
} from "@shared/types/cms.type";
import type {
  IEmailTemplate,
  IPage,
  IFaq,
} from "@shared/interfaces/cms.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const EMAIL_TEMPLATES_API_PATH = "/cms/email-templates";
const PAGES_API_PATH = "/cms/pages";
const FAQS_API_PATH = "/cms/faqs";

// Create base service instances
const emailTemplateService = new BaseService<
  IEmailTemplate,
  TCreateEmailTemplateData,
  TUpdateEmailTemplateData
>(EMAIL_TEMPLATES_API_PATH);

const pageService = new BaseService<
  IPage,
  TCreatePageData,
  TUpdatePageData
>(PAGES_API_PATH);

const faqService = new BaseService<
  IFaq,
  TCreateFaqData,
  TUpdateFaqData
>(FAQS_API_PATH);

// Email Template operations
export const fetchEmailTemplates = (params: IListQueryParams) =>
  emailTemplateService.get<IEmailTemplate>(params);

export const fetchEmailTemplate = (id: string, params?: Record<string, any>) =>
  emailTemplateService.getSingle<IEmailTemplate>(id, params);

export const fetchEmailTemplateByIdentifier = (identifier: string) =>
  emailTemplateService.getSingle<IEmailTemplate>(identifier, undefined, "/identifier");

export const createEmailTemplate = (data: TCreateEmailTemplateData) =>
  emailTemplateService.post<IMessageResponse>(data);

export const updateEmailTemplate = (id: string) => (data: TUpdateEmailTemplateData) =>
  emailTemplateService.patch<IMessageResponse>(id)(data);

export const deleteEmailTemplate = (id: string) =>
  emailTemplateService.delete(id);

// Page operations
export const fetchPages = (params: IListQueryParams) =>
  pageService.get<IPage>(params);

export const fetchPage = (id: string, params?: Record<string, any>) =>
  pageService.getSingle<IPage>(id, params);

export const fetchPageBySlug = (slug: string) =>
  pageService.getSingle<IPage>(slug, undefined, "/slug");

export const createPage = (data: TCreatePageData) =>
  pageService.post<IMessageResponse>(data);

export const updatePage = (id: string) => (data: TUpdatePageData) =>
  pageService.patch<IMessageResponse>(id)(data);

export const deletePage = (id: string) =>
  pageService.delete(id);

// FAQ operations
export const fetchFaqs = (params: IListQueryParams) =>
  faqService.get<IFaq>(params);

export const fetchFaq = (id: string, params?: Record<string, any>) =>
  faqService.getSingle<IFaq>(id, params);

export const createFaq = (data: TCreateFaqData) =>
  faqService.post<IMessageResponse>(data);

export const updateFaq = (id: string) => (data: TUpdateFaqData) =>
  faqService.patch<IMessageResponse>(id)(data);

export const deleteFaq = (id: string) =>
  faqService.delete(id);

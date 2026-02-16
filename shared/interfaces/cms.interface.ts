import {
  EmailTemplateDto,
  PageDto,
  FaqDto,
} from "../dtos/cms-dtos";

export interface IEmailTemplate extends EmailTemplateDto {}

export interface IPage extends PageDto {}

export interface IFaq extends FaqDto {}

export interface IEmailTemplateResponse {
  message: string;
  emailTemplate: IEmailTemplate;
}

export interface IPageResponse {
  message: string;
  page: IPage;
}

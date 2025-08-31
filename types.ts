

export enum Sender {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isActionResponse?: boolean;
}

export interface CarouselButton {
  label: string;
  action: 'query' | 'start_registration';
  value: string; // For 'query', it's the text to send. For 'start_registration', it's the courseId.
}

export interface CarouselItem {
  title: string;
  description: string;
  imageUrl: string;
  buttons: CarouselButton[];
}

export interface QuickReplyButton {
  label:string;
  action: 'query' | 'start_registration' | 'open_form_sv' | 'open_form_bd' | 'confirm_registration' | 'retry_registration' | 'show_category';
  value: string | 'ALL';
}

// This is the master type for all rich content responses from the bot
export interface RichContent {
  type: 'carousel' | 'quick_replies';
  items?: CarouselItem[]; // For carousel
  buttons?: QuickReplyButton[]; // For quick_replies
}

export interface ActionCommand {
    action: 'show_course_list';
    filter: {
      category?: 'SO_CAP' | 'BOI_DUONG' | 'AN_TOAN';
      keyword?: string;
    }
}

export type RegistrationStep = 'idle' | 'awaiting_name' | 'awaiting_dob' | 'awaiting_phone' | 'confirming';

export interface RegistrationData {
    courseId?: string;
    courseName?: string;
    fullName?: string;
    dob?: string;
    phone?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}
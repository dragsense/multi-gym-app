export enum EReminderType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP'
}


export enum EReminderSendBefore {
  ONE_MINUTE = 1,
  TEN_MINUTES = 10,
  THIRTY_MINUTES = 30,
  ONE_HOUR = 60,
  THREE_HOURS = 180,
  ONE_DAY = 720,
  THREE_DAYS = 2160,
}
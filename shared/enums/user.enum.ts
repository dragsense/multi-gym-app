export enum EUserLevels {
  PLATFORM_OWNER = 0,
  SUPER_ADMIN = 1,
  ADMIN = 2,
  STAFF = 3,
  MEMBER = 4,
}

export enum EUserGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

export enum SignupUserLevel {
  SUPER_ADMIN = EUserLevels.SUPER_ADMIN,
  MEMBER = EUserLevels.MEMBER,
}

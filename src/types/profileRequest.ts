export type UpdateProfileRequest = {
  fullName: string;
  email: string;
};

export type UpdatedProfileDto = {
  id: number;
  fullName: string;
  email: string;
  token: string;
  hasAvatar: boolean;
};

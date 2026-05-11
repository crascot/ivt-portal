export type UpdateProfileRequest = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  whatsApp?: string;
};

export type UpdatedProfileDto = {
  id: number;
  fullName: string;
  email: string;
  token: string;
  hasAvatar: boolean;
  phoneNumber: string | null;
  whatsApp: string | null;
};

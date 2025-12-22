import type { IDateValue, ISocialLink } from './common';

// ----------------------------------------------------------------------

export type IUserTableFilters = {
  name: string;
  role: string[];
  status: string;
};

export type IUserProfileCover = {
  name: string;
  role: string;
  coverUrl: string;
  avatarUrl: string;
};

export type IUserProfile = {
  id: string;
  role: string;
  quote: string;
  email: string;
  school: string;
  country: string;
  company: string;
  totalFollowers: number;
  totalFollowing: number;
  socialLinks: ISocialLink;
};

export type IUserProfileFollower = {
  id: string;
  name: string;
  country: string;
  avatarUrl: string;
};

export type IUserProfileGallery = {
  id: string;
  title: string;
  imageUrl: string;
  postedAt: IDateValue;
};

export type IUserProfileFriend = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
};

export type IUserProfilePost = {
  id: string;
  media: string;
  message: string;
  createdAt: IDateValue;
  personLikes: { name: string; avatarUrl: string }[];
  comments: {
    id: string;
    message: string;
    createdAt: IDateValue;
    author: { id: string; name: string; avatarUrl: string };
  }[];
};

export type IUserItem = {
  id: string;
  name: string;

  // NEW: auth username (optional because your GET /users may not return it yet)
  username: string;

  // table / list fields
  email?: string;
  status?: 'ACTIVE' | 'REMOVE';
  avatarUrl?: string;
  isVerified?: boolean;

  // contact / location
  phoneNumber?: string;
  /** 2-letter country code for the phone number, e.g. "PH", "DE" */
  phoneCountry?: string;

  city?: string;
  state?: string;
  address?: string;
  country?: string;
  zipCode?: string;
  company?: string;

  // extra profile info
  firstName?: string;
  lastName?: string;

  role: string;
  roleId?: number | null;

  department?: string;
  departmentId?: number | null;
};

export type IUserAccountBillingHistory = {
  id: string;
  price: number;
  invoiceNumber: string;
  createdAt: IDateValue;
};

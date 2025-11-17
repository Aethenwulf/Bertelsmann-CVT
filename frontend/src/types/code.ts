import type { IDateValue } from './common';

export type IPostCOC = {
  id: string;
  staffName: string;
  staffId: string;
  campaign: string;
  teamLeader: string;
  reportBy: string;
  incidentDate: IDateValue;
  reportDate: IDateValue;
  category: string;
  subCategory: string;
  breach: string[];
  description: string;
  breachCount: number;
  breachType: string;
  counselling: boolean;
  behaviorChange: boolean;
  sanctionDate: IDateValue;
  actionDeliberate: boolean;
  recommendedAction: string;
  forReview: boolean;
  leniency: string;
  forDole: string;
  executiveName: string;
  date: IDateValue;
};

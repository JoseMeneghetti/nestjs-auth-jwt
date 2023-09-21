export type IUser = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  hash: string;
  hashedRt: string;
  count: number;
};

export type IMeResponse = {
  id: number;
  email: string;
};
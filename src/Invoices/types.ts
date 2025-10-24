export type TItem = {
  id: string;
  cost: number;
  activities: string;
};

export type TControllerState = {
  hourPrice: number;
  items: TItem[];
  extra: TItem[];
  tempStr: string;
  tempCost: string;
};

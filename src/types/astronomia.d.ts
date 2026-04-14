declare module "astronomia" {
  export const solar: {
    apparentEquatorial(jd: number): { ra: number; dec: number };
    radius(T: number): number;
  };
  export const moonposition: {
    position(jd: number): { ra: number; dec: number; range: number };
  };
  export const julian: {
    DateToJD(date: Date): number;
  };
  export const sidereal: {
    apparent(jd: number): number;
  };
  export const base: {
    J2000Century(jd: number): number;
  };
}

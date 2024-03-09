declare module "lodash-move" {
  const move: <T>(array: T[], moveIndex: number, toIndex: number) => T[];
  export default move;
}

// TODO: unfinished
interface PhotonControlOptions {
  url: string;
  position: string;
  placeholder: string;
  minChar: number;
  limit: number;
  submitDelay: number;
  includePosition: boolean;
  noResultLabel: string;
  feedbackEmail: string | null;
  feedbackLabel: string;
}

declare namespace L {
  namespace control {
    function photon(options?: any): any;
  }
}

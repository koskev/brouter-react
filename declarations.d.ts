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

declare module "chart.js" {
  interface TooltipPositionerMap {
    mouse: TooltipPositionerFunction<ChartType>;
  }

  // FIXME: this is just to satisfy the compiler. @types/chart.js seems incomplete/not working?
  class Chart {
    static register(...items: any);
  }
  class CategoryScale {}
  class LinearScale {}
  class BarElement {}
  class Title {}
  class Tooltip {
    static positioners: { [mode: string]: ChartTooltipPositioner };
  }
  class Legend {}
}

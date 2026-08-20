export class Range {
  filtertype = "range";
  range = [0, 0];

  constructor(min = 0, max = 10000) {
    this.range = [min, max];
  }
  // probably should add, getMin, GetMax, setMin, SetMax
}
export class DateRange extends Range {
  filtertype = "dateRange";
  constructor(min, max) {
    super(min, max);
    this.filtertype = "dateRange";
  }
}
export class NumericRange extends Range {
  filtertype = "numericRange";
  limitRange = [-10000, 10000];
  minField = "minDepth";
  maxField = "maxDepth";
  constructor(
    min,
    max,
    minField = "minDepth",
    maxField = "maxDepth",
    limitMin = -10000,
    limitMax = 10000
  ) {
    super(min, max);
    this.limitRange = [limitMin, limitMax];
    this.minField = minField;
    this.maxField = maxField;
    this.filtertype = "numericRange";
  }
}

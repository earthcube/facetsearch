class Range {
    filtertype = 'range';
    min = undefined;
    max = undefined;
    constructor(min=0, max=10000) {
        this.min = min;
        this.max = max;
    }

}
class DateRange extends Range {
    filtertype = 'dateRange';

    constructor(min, max) {
        super(min, max);
        this.filtertype = 'dateRange';
    }

}
class NumericRange extends Range{
    filtertype = 'numericRange';
    limitMin = -10000
    limitMax = 10000
    constructor(min, max,limitMin=-10000,limitMax=10000 ) {
        super(min, max);
        this.limitMax=limitMax
        this.limitMin=limitMin
        this.filtertype = 'numericRange';
    }
}

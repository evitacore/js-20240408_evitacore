import fetchJson from './utils/fetch-json.js';
import ColumnChartV1 from '../../04-oop-basic-intro-to-dom/1-column-chart/index.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChartV2 extends ColumnChartV1 {

    constructor(props = {}) {
        super(props);
        this.url = new URL(props.url, BACKEND_URL);
        this.from = props.range?.from ?? new Date();
        this.to = props.range?.to ?? new Date();

        this.createSubElements();
        this.update(this.from, this.to);
    }
     
    async update(from, to) {
        this.element.classList.add('column-chart_loading');
        const data = await this.loadData(from, to);
        super.update(Object.values(data));
        this.element.classList.remove('column-chart_loading');
        return data;
    }

    async loadData(from, to) {
        this.url.searchParams.set('from', from);
        this.url.searchParams.set('to', to);
        const response = await fetchJson(this.url);
        return response;
    }
}

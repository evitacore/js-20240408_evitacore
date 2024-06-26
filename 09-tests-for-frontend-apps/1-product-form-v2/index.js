import SortableList from '../2-sortable-list/index.js';
import ProductFormV1 from '../../08-forms-fetch-api-part-2/1-product-form-v1/index.js';

export default class ProductFormV2 extends ProductFormV1 {

    constructor (productId) {
        super(productId);
        this.productId = productId;
    }

    setTemplateData(categories, product) {
        const items = this.createImageElements(product.images);
        const sortableList = new SortableList({items}); 

        this.subElements.subcategory.innerHTML = this.createSubcategoryTemplate(categories);
        this.subElements.imageListContainer.append(sortableList.element);
    }

    createImageElements(data) {
        const fragment = document.createDocumentFragment();
        data.forEach(image => {
            const template = document.createElement('template');
            template.innerHTML = this.createImageTemplate(image).trim();
            fragment.appendChild(template.content.firstChild);
        });
        return Array.from(fragment.children);
    }
}

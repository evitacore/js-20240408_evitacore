import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';
const API_PRODUCTS = '/api/rest/products';
const API_CATEGORIES = '/api/rest/categories';

export default class ProductForm {
    element;
    subElements = {};
    defaultFromData = {
        title: '',
        description: '', 
        quantity: 0,
        status: 1,
        images: [],
        price: 0,
        discount: 0
    }

    constructor(productId) {
        this.productId = productId;
    }

    async render () {
        const promises = [
            this.loadCategoriesData(), 
            this.productId ? this.loadProductsData() : Promise.resolve([this.defaultFromData])
        ]
        const [ categories, [product] ] = await Promise.all(promises);
        this.defaultFromData = product;
        this.element = this.createElement(this.createFormTemplate());
        this.createSubElements();
        this.setTemplateData(categories, product);
        this.createEventListeners();

        return this.element;
    }

    setTemplateData(categories, product) {
        this.subElements.subcategory.innerHTML = this.createSubcategoryTemplate(categories);
        this.subElements.imageListContainer.innerHTML = this.createImageListTemplate(product.images);
    }

    createElement(template) {
        const element = document.createElement('div');
        element.innerHTML = template;
        return element.firstChild;
    }

    createSubElements() {
        this.subElements = [...this.element.querySelectorAll('[data-element]')].reduce((acc, subElement) => {
            acc[subElement.dataset.element] = subElement;
            return acc;
        }, {});
    }

    createSubcategoryTemplate(data) {
        return data.map(category => {
            return category.subcategories.map(subcategory => {
                return `<option value="${subcategory.id}">${category.title} &gt; ${subcategory.title}</option>`;
            }).join('');
        }).join('');
    }

    createImageListTemplate(data) {
        return(
            `<ul class="sortable-list" name="images">
                ${data.map(image => this.createImageTemplate(image)).join('')}
            </ul>`
        )
    }

    createImageTemplate({ url, source }) {
        return(
            `<li class="products-edit__imagelist-item sortable-list__item" style="">
                <input type="hidden" name="url" value=${escapeHtml(url)}>
                <input type="hidden" name="source" value=${escapeHtml(source)}>
                <span>
                    <img src="icon-grab.svg" data-grab-handle="" alt="grab">
                    <img class="sortable-table__cell-img" alt="Image" src=${escapeHtml(url)} referrerpolicy="no-referrer">
                    <span>${escapeHtml(source)}</span>
                </span>
                <button type="button" data-element="deleteImage" data-action="delete">
                    <img src="icon-trash.svg" data-delete-handle="" alt="delete">
                </button>
            </li>`
        )
    }

    createFormTemplate() {
        return(
            `<div class="product-form">
                <form data-element="productForm" class="form-grid">
                    <div class="form-group form-group__half_left">
                        <fieldset>
                            <label class="form-label">Название товара</label>
                            <input required="" type="text" id="title" name="title" class="form-control" placeholder="Название товара" value="${escapeHtml(this.defaultFromData.title)}">
                        </fieldset>
                    </div>
                    <div class="form-group form-group__wide">
                        <label class="form-label">Описание</label>
                        <textarea required="" class="form-control" id="description" name="description" data-element="productDescription" placeholder="Описание товара">${this.defaultFromData.description}</textarea>
                    </div>
                    <div class="form-group form-group__wide" data-element="sortable-list-container">
                        <label class="form-label">Фото</label>
                        <div data-element="imageListContainer"></div>
                        <button type="button" name="uploadImage" id="uploadImage" data-element="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
                    </div>
                    <div class="form-group form-group__half_left">
                        <label class="form-label">Категория</label>
                        <select class="form-control" id="subcategory" name="subcategory" data-element="subcategory"></select>
                    </div>
                    <div class="form-group form-group__half_left form-group__two-col">
                        <fieldset>
                            <label class="form-label">Цена ($)</label>
                            <input required="" id="price" type="number" name="price" class="form-control" placeholder="100" value="${this.defaultFromData.price}">
                        </fieldset>
                        <fieldset>
                            <label class="form-label">Скидка ($)</label>
                            <input required="" id="discount" type="number" name="discount" class="form-control" placeholder="0" value="${this.defaultFromData.discount}">
                        </fieldset>
                    </div>
                    <div class="form-group form-group__part-half">
                        <label class="form-label">Количество</label>
                        <input required="" id="quantity" type="number" class="form-control" name="quantity" placeholder="1" value="${this.defaultFromData.quantity}">
                    </div>
                    <div class="form-group form-group__part-half">
                        <label class="form-label">Статус</label>
                        <select id="status" class="form-control" value="${this.defaultFromData.status}" name="status">
                            <option value="1">Активен</option>
                            <option value="0">Неактивен</option>
                        </select>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" name="save" class="button-primary-outline">
                            ${this.productId ? "Сохранить" : "Добавить"} товар
                        </button>
                    </div>
                </form>
            </div>`
        )
    }

    getFormData() {
        const formData = new FormData(this.subElements.productForm);
        formData.delete('url');
        formData.delete('source');
        formData.set('id', this.defaultFromData.id);

        const data = Object.fromEntries(formData.entries());

        return {
            ...data,
            quantity: Number(data.quantity),
            price: Number(data.price),
            discount: Number(data.discount),
            status: Number(data.status),
            images: this.defaultFromData.images
        };
    }

    async save() {
        const data = this.getFormData();
        const url = new URL(API_PRODUCTS, BACKEND_URL);
        const method = this.productId ? 'PATCH' : 'POST';
        const headers = new Headers({
            'Content-Type': 'application/json'
        });

        try {
            const response = await fetchJson(url, {
                method, 
                headers,
                body: JSON.stringify(data)
            });

            this.dispatchCustomEvent(response.id ? "product-saved" : "product-updated");
        } catch(error) {
            console.error(error);
        }
    }

    async loadProductsData() {
        const url = new URL(API_PRODUCTS, BACKEND_URL);
        url.searchParams.set('id', this.productId);
        return await fetchJson(url);
    }
    
    async loadCategoriesData() {
        const url = new URL(API_CATEGORIES, BACKEND_URL);
        url.searchParams.set('_sort', 'weight');
        url.searchParams.set('_refs', 'subcategory');
        return await fetchJson(url);
    }

    openImage = async () => new Promise((resolve, reject) => {
        const fileInputElement = this.createFileInputElement();

        document.body.appendChild(fileInputElement);

        const handleChange = (e) => {
            document.body.removeChild(fileInputElement);
            e.target.removeEventListener('change', handleChange);
            e.target.removeEventListener("cancel", handleCancel);

            if (e.target && e.target.files && e.target.files[0]) {
                resolve(e.target.files[0]);
            } else {
                reject();
            }
        }

        const handleCancel = (e) => {
            document.body.removeChild(fileInputElement);
            e.target.removeEventListener('change', handleChange);
            e.target.removeEventListener("cancel", handleCancel);
            reject();
        }
        
        fileInputElement.addEventListener('change', handleChange);
        fileInputElement.addEventListener("cancel", handleCancel);

        fileInputElement.click();
    })

    addLoader() {
        this.subElements.uploadImage.classList.add('is-loading');
        this.subElements.uploadImage.disabled = true;
    }

    removeLoader() {
        this.subElements.uploadImage.classList.remove('is-loading');
        this.subElements.uploadImage.disabled = false;
    }

    handleUploadImage = async (e) => { 
        try {
            const image = await this.openImage();
            const formData = new FormData();
            formData.append('image', image);

            this.addLoader();

            const response = await this.uploadImage(formData);

            this.removeLoader();

            const dataImage = {
                url: response.data.link,
                source: image.name
            }
            const newImageTemplate = this.createImageTemplate(dataImage);

            this.subElements.imageListContainer.firstChild.insertAdjacentHTML('beforeend', newImageTemplate);
            this.defaultFromData.images.push(dataImage);

        } catch (error) {
            console.error('Error uploading image:', error);
            this.removeLoader();
        }
    }

    createFileInputElement() {
        const element = document.createElement(`input`);

        element.name = "image";
        element.style.display = "none";
        element.type = "file";
        element.accept = "image/*";

        return element;
    }

    async uploadImage(body) {
        const url = new URL("https://api.imgur.com/3/image");
        const headers = new Headers({ Authorization: IMGUR_CLIENT_ID });
    
        const response = await fetchJson(url, {
            method: "POST",
            headers,
            body,
        });
    
        return response;
    };
    
    handleSubmitForm = (e) => {
        e.preventDefault();
        this.save();
    }

    createEventListeners() {
        this.subElements.productForm.addEventListener('submit', this.handleSubmitForm);
        this.subElements.uploadImage.addEventListener('pointerdown', this.handleUploadImage)
    }

    destroyEventListeners() {
        this.subElements.productForm.removeEventListener('submit', this.handleSubmitForm);
        this.subElements.uploadImage.removeEventListener('pointerdown', this.handleUploadImage)
    } 

    dispatchCustomEvent = (name, detail = {}) => {
        const event = new CustomEvent(name, {
            bubbles: true, 
            detail
        });
        this.element.dispatchEvent(event);
    }

    remove() {
        this.element.remove();
    }

    destroy() {
        this.remove();
        this.destroyEventListeners();
    }
}

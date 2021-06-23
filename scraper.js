const axios = require('axios');
const cheerio = require('cheerio');
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class Scraper {

    constructor() {
        this.Products = [];
        this.searchTerm = "";
        this.currentPage = 1;
        this.pages = -1;
        this.$;

        // Initiate the script.
        this.init();
    }

    init() {
        let _this = this;
        rl.question(`Amazon Scraper by <andreielvis> on Tiktok - Write a search term:\n\n`, (sterm) => {
            _this.searchTerm = sterm;
            _this.getProducts();
        });
        rl.on("close", () => process.exit(0));
    }

    getProducts() {
        let _this = this;
        this.axiosRequest(response => {
            _this.$ = cheerio.load(response.data);
            let total_pages = _this.$(`.a-pagination .a-disabled:eq(2)`).text();

            _this.$(`.s-result-item`).each((i,e) => {
                let product = _this.getProductData(e);
                if(isNaN(product.price)) return;
                _this.Products.push(product);
                console.log(product);
            });

            _this.currentPage++;

            if(_this.pages == -1) _this.pages = total_pages;
            if(_this.currentPage == _this.pages) _this.writeProducts();
            else _this.getProducts();
        });
    }

    axiosRequest(cb) {
        let URL = `https://www.amazon.com/s?k=${this.searchTerm.split(" ").join("+")}&page=${this.currentPage}`;
        axios({
            url: URL,
            method: "get",
            headers: {
                "User-Agent": "Opera/9.43 (Windows NT 6.2; en-US) Presto/2.11.255 Version/11.00"
            }
        })
        .then(response => {
            cb(response);
        })
        .catch(error => console.error(error));

    }

    writeProducts() {
        fs.writeFileSync(path.join(__dirname, "products.json"), JSON.stringify(this.Products));
        rl.close();
    }

    getProductData(e) {
        let row = this.$(e).find(".sg-row:eq(1)");
        return {
            name: row.find(".a-text-normal").text(),
            link: row.find(".a-link-normal").attr("href"),
            image: row.find(".rush-component .s-image").attr("src"),
            currency: row.find(".a-price .a-price-symbol").text(),
            price: parseFloat( parseFloat( row.find(".a-price .a-price-whole").text() ) + `0.${row.find(".a-price .a-price-fraction").text()}` ),
        };
    }

}

let scr = new Scraper();